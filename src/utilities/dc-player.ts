import {
  ChatInputCommandInteraction,
  ButtonInteraction,
  ModalSubmitInteraction,
} from "discord.js";

import {
  VoiceConnectionStatus,
  joinVoiceChannel,
  getVoiceConnection,
  AudioPlayerStatus,
  VoiceConnection,
} from "@discordjs/voice";

import { video_basic_info, InfoData, yt_validate } from "play-dl";

import { PlayBar } from "../components/PlayBar";
import { Player } from "./player";
import { AudioInfo } from "./audioInfo";
import { PlaylistModal } from "../components/playlistModal";

class DcPlayer {
  public playBar: PlayBar;
  public player: Player;
  public playlistModal: PlaylistModal;
  private voiceConnection: VoiceConnection | undefined;
  private index: number;
  private queue: Array<AudioInfo>;

  constructor() {
    this.playBar = new PlayBar();
    this.player = new Player();
    this.playlistModal = new PlaylistModal();

    this.voiceConnection = undefined;

    this.index = 0;
    this.queue = [];
  }

  public async executeCommand(interaction: ChatInputCommandInteraction) {
    switch (interaction.commandId) {
      case "player": {
        await interaction.deferReply();
        await interaction.editReply({
          embeds: [this.playBar.embed],
          components: [this.playBar.row],
        });
        break;
      }
    }
  }

  public async executeButton(interaction: ButtonInteraction) {
    try {
      switch (interaction.customId) {
        case "play_pause_button": {
          await this.playPause(interaction);
          break;
        }
        case "next_button": {
          await this.next(interaction);
          break;
        }
        case "previous_button": {
          await this.previous(interaction);
          break;
        }
        case "stop_button": {
          await this.stop(interaction);
          break;
        }
        case "plus_button": {
          await this.plus_song(interaction);
          break;
        }
      }
    } catch (err) {
      throw err;
    }
  }

  public async executeSubmit(interaction: ModalSubmitInteraction) {
    const input_urls = interaction.fields
      .getTextInputValue("music_url_list_input")
      .split("\n");

    await interaction.deferReply();

    const promises = [];
    for (const url of input_urls) {
      if (yt_validate(url) == "video") {
        promises.push(video_basic_info(url));
      }
    }

    let result = await Promise.all(promises);
    for (let i = 0, len = result.length; i < len; i++) {
      let video_details = (<InfoData>result[i]).video_details;
      if (!video_details) {
        continue;
      }
      const audioInfo = new AudioInfo(
        video_details.title || "",
        video_details.url,
        video_details.durationInSec
      );
      this.queue.push(audioInfo);
    }

    this.updatePlayBar();

    const message = await interaction.channel?.messages
      .fetch(`${interaction.message?.id}`)
      .catch((err) => {
        throw err;
      });

    await message?.edit({ embeds: [this.playBar.embed] });
    await interaction.deleteReply().catch((err) => {
      throw err;
    });
  }

  private async playPause(interaction: ButtonInteraction) {
    const { guildId, member } = interaction;
    if (!interaction || !guildId || !member) {
      throw new Error(`[ERROR] No interaction, guildId or member`);
    }

    const guildMember = interaction.guild?.members.cache.get(member.user.id);
    if (!guildMember?.voice.channelId || !guildMember?.voice.channel) {
      throw new Error(
        `[ERROR] ${guildMember?.displayName} not in an voice channel`
      );
    }

    await interaction.deferReply();

    if (
      getVoiceConnection(guildId)?.state?.status != VoiceConnectionStatus.Ready
    ) {
      joinVoiceChannel({
        channelId: guildMember.voice.channelId,
        guildId: guildId,
        adapterCreator: guildMember?.voice.channel.guild.voiceAdapterCreator,
      });
    }

    this.voiceConnection = getVoiceConnection(guildId);
    this.voiceConnection?.subscribe(this.player);

    switch (this.player.state.status) {
      case AudioPlayerStatus.Playing: {
        this.player.pause();
        this.playBar.row.components[1].setEmoji("⏸️");
        return;
      }
      case AudioPlayerStatus.Paused: {
        this.player.unpause();

        this.playBar.row.components[1].setEmoji("▶️");
        break;
      }
      case AudioPlayerStatus.Idle: {
        if (this.queue.length == 0) {
          return;
        }
        this.playBar.row.components[1].setEmoji("⏸️");
        this.playNow();
        break;
      }
    }

    await interaction.deleteReply();
  }

  private async previous(interaction: ButtonInteraction) {
    await interaction.deferReply();

    this.index = (this.index - 1 + this.queue.length) % this.queue.length;

    this.playNow();

    await this.editPlayBarMessage(interaction);
    await interaction.deleteReply();
  }

  private async next(interaction: ButtonInteraction) {
    await interaction.deferReply();

    this.index = (this.index + 1) % this.queue.length;

    this.playNow();

    await this.editPlayBarMessage(interaction);
    await interaction.deleteReply();
  }

  private playNow() {
    try {
      this.player.playSong(this.queue[this.index].url);
    } catch (err) {
      console.log("[ERROR] Play song occur error");
    }
  }

  private async stop(interaction: ButtonInteraction) {
    await interaction.deferReply();

    this.player.stop();

    this.queue.length = 0;
    this.index = 0;

    this.voiceConnection?.destroy();
    this.voiceConnection = undefined;

    await this.editPlayBarMessage(interaction);
    await interaction.deleteReply();
  }

  private async plus_song(interaction: ButtonInteraction) {
    await interaction.showModal(this.playlistModal).catch((err: Error) => {
      throw err;
    });
  }

  private async editPlayBarMessage(interaction: ButtonInteraction) {
    this.updatePlayBar();
    const message = await interaction.channel?.messages
      .fetch(`${interaction.message?.id}`)
      .catch((err) => {
        throw err;
      });

    await message?.edit({ embeds: [this.playBar.embed] });
  }

  private updatePlayBar() {
    const index = [];
    const music = [];
    const time = [];
    for (let i = 0, len = this.queue.length; i < len; i++) {
      const { title, durationInMins } = this.queue[i];
      index.push(i + 1);
      music.push(title.length < 50 ? title : title.slice(0, 47) + "...");
      time.push(durationInMins);
    }
    this.playBar.embed = this.playBar.generateEmbed(
      index.length == 0 ? "\u200B" : index.join("\n"),
      music.length == 0 ? "\u200B" : music.join("\n"),
      time.length == 0 ? "\u200B" : time.join("\n"),
      this.queue[this.index]?.title
    );
  }
}

export { DcPlayer };
