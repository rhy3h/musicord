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

    this.embed = new EmbedBuilder().setColor(0x0099ff).setTitle("Playlist");
  }
}

export { PlayBar };
