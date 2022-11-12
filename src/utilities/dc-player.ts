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

import { video_basic_info } from "play-dl";

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

    switch (interaction.customId) {
      case "play_pause_button": {
        if (this.player.state.status == AudioPlayerStatus.Playing) {
          this.playBar.row.components[1].setEmoji("▶️");
        } else {
          this.playBar.row.components[1].setEmoji("⏸️");
        }

        this.playPause();
        await interaction
          .update({
            components: [this.playBar.row],
          })
          .catch((err) => {
            throw err;
          });
        return;
      }
      case "next_button": {
        this.next();
        break;
      }
      case "previous_button": {
        this.previous();
        break;
      }
      case "stop_button": {
        this.stop();
        break;
      }
      case "plus_button": {
        await interaction.showModal(this.playlistModal).catch((err) => {
          throw err;
        });
        return;
      }
    }

    this.updatePlayBar();
    await interaction.update({ embeds: [this.playBar.embed] }).catch((err) => {
      throw err;
    });
  }

  public async executeSubmit(interaction: ModalSubmitInteraction) {
    const input_urls = interaction.fields
      .getTextInputValue("music_url_list_input")
      .split("\n");

    await interaction.deferReply();
    for (const url of input_urls) {
      const sampleInfo = (
        await video_basic_info(url).catch((err) => {
          return;
        })
      )?.video_details;

      if (!sampleInfo) {
        continue;
      }

      const audioInfo = new AudioInfo(
        sampleInfo.title || "",
        sampleInfo.url,
        sampleInfo.durationInSec
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

  private playPause() {
    switch (this.player.state.status) {
      case AudioPlayerStatus.Playing: {
        this.player.pause();
        return;
      }
      case AudioPlayerStatus.Paused: {
        this.player.unpause();
        break;
      }
      case AudioPlayerStatus.Idle: {
        if (this.queue.length == 0) {
          return;
        }
        this.playNow();
        break;
      }
    }
  }

  private previous() {
    this.index = (this.index - 1 + this.queue.length) % this.queue.length;

    this.playNow();
  }

  private next() {
    this.index = (this.index + 1) % this.queue.length;

    this.playNow();
  }

  private playNow() {
    try {
      this.player.playSong(this.queue[this.index].url);
    } catch (err) {
      console.log("[ERROR] Play song occur error");
    }
  }

  private stop() {
    this.player.stop();

    this.queue.length = 0;
    this.index = 0;

    this.disconect();
  }

  private disconect() {
    this.voiceConnection?.destroy();
    this.voiceConnection = undefined;
  }

  public playList() {
    if (this.queue.length == 0) {
      return "";
    }

    let text = "```ansi\n";

    for (let i = 0, len = this.queue.length; i < len; i++) {
      const prefix = `${i == this.index ? "[2;45m" : "[0m"}${i + 1}`;
      const { audioText } = this.queue[i];

      text += `${prefix} ${audioText} \n`;
    }

    text += "```";
    return text;
  }

  private updatePlayBar() {
    this.playBar.embed.data.description = this.playList();
  }
}

export { DcPlayer };
