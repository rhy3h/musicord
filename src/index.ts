import { Events, GatewayIntentBits } from "discord.js";
import { token } from "./config.json";
import { DcClient } from "./utilities/dc-client";
import { DcPlayer } from "./utilities/dc-player";
const client = new DcClient({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Discord bot on ready
client.once(Events.ClientReady, () => {
  console.log(`Discord Bot "${client.user?.tag}" is ready!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  const dcClient = <DcClient>interaction.client;
  const { guildId } = interaction;
  if (!guildId) {
    return;
  }

  if (!dcClient.dcPlayers.get(guildId)) {
    const dcPlayer = new DcPlayer();
    dcClient.dcPlayers.set(guildId, dcPlayer);
  }

  const dcPlayer = <DcPlayer>dcClient.dcPlayers.get(guildId);

  if (interaction.isChatInputCommand()) {
    await dcPlayer.executeCommand(interaction);
  }
  if (interaction.isButton()) {
    await dcPlayer.executeButton(interaction);
  }
  if (interaction.isModalSubmit()) {
    await dcPlayer.executeSubmit(interaction);
  }
});

client.login(token);
