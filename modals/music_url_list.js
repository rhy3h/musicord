const {} = require("discord.js");
const DiscordPlayer = require("../utilities/discordPlayer");

module.exports = {
  id: "music_url_list_modal",
  async execute(interaction, client) {
    const { guildId } = interaction;
    const urls_input = interaction.fields
      .getTextInputValue("music_url_list_input")
      .split("\n");

    if (!client.discordPlayers.get(guildId)) {
      let discordPlayer = new DiscordPlayer();

      client.discordPlayers.set(guildId, discordPlayer);
    }

    const discordPlayer = client.discordPlayers.get(guildId);

    discordPlayer.appendPlayList(urls_input);

    interaction.message.embeds[0].data.description =
      discordPlayer.getPlayList();
    await interaction.update({
      embeds: interaction.message.embeds,
    });
  },
};
