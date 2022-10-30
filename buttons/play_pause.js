const {
  VoiceConnectionStatus,
  joinVoiceChannel,
  getVoiceConnection,
} = require("@discordjs/voice");

const DiscordPlayer = require("../utilities/discordPlayer");

module.exports = {
  id: "play_pause_button",
  async execute(interaction, client) {
    const { guildId, member } = interaction;
    if (!member.voice.channelId) {
      await interaction.update({});
      return;
    }

    if (!client.discordPlayers.get(guildId)) {
      let discordPlayer = new DiscordPlayer();

      client.discordPlayers.set(guildId, discordPlayer);
    }

    const discordPlayer = client.discordPlayers.get(guildId);
    const coiceConnection = getVoiceConnection(guildId);
    if (coiceConnection?.state?.status != VoiceConnectionStatus.Ready) {
      const voiceChannel = joinVoiceChannel({
        channelId: member.voice.channelId,
        guildId: guildId,
        adapterCreator: member.voice.channel.guild.voiceAdapterCreator,
      });
      voiceChannel.subscribe(discordPlayer.player);
      discordPlayer.setVoiceChannel(voiceChannel);
    }

    discordPlayer.play_pause();

    interaction.message.embeds[0].data.description =
      discordPlayer.getPlayList();
    await interaction.update({
      embeds: interaction.message.embeds,
    });
  },
};
