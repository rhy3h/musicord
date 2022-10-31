import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

class PlaylistModal extends ModalBuilder {
  constructor() {
    super();

    this.setCustomId("music_url_list_modal").setTitle("Url");

    const urlInput = new TextInputBuilder()
      .setCustomId("music_url_list_input")
      .setLabel("What do you want to play")
      .setStyle(TextInputStyle.Paragraph);

    this.addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(urlInput)
    );
  }
}

export { PlaylistModal };
