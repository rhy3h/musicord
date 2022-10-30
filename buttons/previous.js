module.exports = {
  id: "previous_button",
  async execute(interaction, client) {
    const { guildId } = interaction;

    if (!client.discordPlayers.get(guildId)) {
      await interaction.update({});
      return;
    }

    const discordPlayer = client.discordPlayers.get(guildId);

    discordPlayer.previous();

    interaction.message.embeds[0].data.description =
      discordPlayer.getPlayList();
    await interaction.update({
      embeds: interaction.message.embeds,
    });
  },
};
