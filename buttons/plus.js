const {
  ModalBuilder,
  TextInputBuilder,
  ActionRowBuilder,
  TextInputStyle,
} = require("discord.js");

module.exports = {
  id: "plus_button",
  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("music_url_list_modal")
      .setTitle("Url");

    const urlInput = new TextInputBuilder()
      .setCustomId("music_url_list_input")
      .setLabel("What do you want to play")
      .setStyle(TextInputStyle.Paragraph);

    modal.addComponents(new ActionRowBuilder().addComponents(urlInput));

    await interaction.showModal(modal);
  },
};
