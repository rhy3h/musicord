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

import { video_basic_info, YouTubeVideo } from "play-dl";

import { PlayBar } from "../commands/playbar";
import { Player } from "../commands/player";
import { AudioInfo } from "../commands/audioInfo";
import { PlaylistModal } from "../commands/playlistModal";

class DcPlayer {
  public playBar: PlayBar;
  public player: Player;
  public playlistModal: PlaylistModal;
  private voiceConnection: VoiceConnection | undefined;
  private index: number;
  private queue: Array<AudioInfo>;

  private sampleQueue = [
    "https://youtu.be/2OqfhxAp9N0",
    "https://youtu.be/mBZdHuZCfic",
    "https://youtu.be/8IRX1C6vC_I",
    "https://youtu.be/tC35oqxnm90",
  ];

  constructor() {
    this.playBar = new PlayBar();
    this.player = new Player();
    this.playlistModal = new PlaylistModal();

    this.voiceConnection = undefined;

    this.index = 0;
    this.queue = [];
  }

  public async executeCommand(interaction: ChatInputCommandInteraction) {
    interaction.reply({
      embeds: [this.playBar.embed],
      components: [this.playBar.row],
    });
  }

  public async executeButton(interaction: ButtonInteraction) {
    const { guildId, member } = interaction;

    if (!interaction || !guildId || !member) {
      return;
    }

    const guildMember = interaction.guild?.members.cache.get(member.user.id);
    if (!guildMember?.voice.channelId || !guildMember?.voice.channel) {
      return;
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

    if (this.queue.length == 0) {
      for (const sample of this.sampleQueue) {
        const sampleInfo = (await video_basic_info(sample)).video_details;
        const audioInfo = new AudioInfo(
          sampleInfo.title || "",
          sampleInfo.url,
          sampleInfo.durationInSec
        );
        this.queue.push(audioInfo);
      }
    }

    switch (interaction.customId) {
      case "play_pause_button": {
        if (this.player.state.status == AudioPlayerStatus.Playing) {
          this.playBar.row.components[1].setEmoji("▶️");
        } else {
          this.playBar.row.components[1].setEmoji("⏸️");
        }

        this.playPause();

        await interaction.update({
          components: [this.playBar.row],
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
        await interaction.showModal(this.playlistModal);
        return;
      }
    }

    this.updatePlayBar();
    await interaction.update({ embeds: [this.playBar.embed] });
  }

  public async executeSubmit(interaction: ModalSubmitInteraction) {
    const input_urls = interaction.fields
      .getTextInputValue("music_url_list_input")
      .split("\n");

    for (const url of input_urls) {
      try {
        const sampleInfo = (await video_basic_info(url)).video_details;
        const audioInfo = new AudioInfo(
          sampleInfo.title || "",
          sampleInfo.url,
          sampleInfo.durationInSec
        );
        this.queue.push(audioInfo);
      } catch (err) {}
    }
    this.updatePlayBar();

    try {
      const message = await interaction.channel?.messages.fetch(
        `${interaction.message?.id}`
      );
      await message?.edit({ embeds: [this.playBar.embed] });
      await interaction.reply({
        content: "Success",
      });
      await interaction.deleteReply();
    } catch (err) {
      await interaction.reply({
        content: "Fail",
      });
      await interaction.deleteReply();
    }
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
      console.log("[ERROR] playNow");
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
