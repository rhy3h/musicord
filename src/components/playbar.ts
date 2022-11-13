import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

class PlayBar {
  public row: ActionRowBuilder<ButtonBuilder>;
  public embed: EmbedBuilder;

  constructor() {
    // TODO: Declare ButtonID
    this.row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("previous_button")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏮️"),
      new ButtonBuilder()
        .setCustomId("play_pause_button")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("▶️"),
      new ButtonBuilder()
        .setCustomId("next_button")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏭️"),
      new ButtonBuilder()
        .setCustomId("stop_button")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏹️"),
      new ButtonBuilder()
        .setCustomId("plus_button")
        .setStyle(ButtonStyle.Secondary)
        .setEmoji("⏏️")
    );

    this.embed = this.generateEmbed("\u200b", "\u200b", "\u200b");
  }

  public generateEmbed(
    index: string,
    music: string,
    time: string,
    playing?: string
  ) {
    return new EmbedBuilder({
      color: 0x0099ff,
      title: "Playlist",
      description: playing ? `Now Playing '${playing}'` : "",
      fields: [
        { name: "\u200B", value: index, inline: true },
        { name: "Name", value: music, inline: true },
        { name: "Time", value: time, inline: true },
      ],
    });
  }
}

export { PlayBar };
