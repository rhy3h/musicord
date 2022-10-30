const {
  ActionRowBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playbar")
    .setNameLocalizations({ "zh-TW": "播放列" })
    .setDescription("play options")
    .setDescriptionLocalizations({ "zh-TW": "播放選項" }),
  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
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

    const embed = new EmbedBuilder().setColor(0x0099ff).setTitle("Playlist");

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  },
};
