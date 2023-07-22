import { Events, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";

import { DcClient } from "./utilities/dc-client";
import { DcPlayer } from "./utilities/dc-player";

config();

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

  // Slash Commands
  if (interaction.isChatInputCommand()) {
    await client.executeChatInputCommand(interaction).catch((error) => {
      console.log(`${error.name} ${error.message}`);
    });
  }

  if (interaction.isButton()) {
    await dcPlayer.executeButton(interaction).catch((error) => {
      console.log(`${error.name} ${error.message}`);
    });
  }
  if (interaction.isModalSubmit()) {
    await dcPlayer.executeSubmit(interaction).catch((error) => {
      console.log(`${error.name} ${error.message}`);
    });
  }
});

client.login(process.env.MUSICORD_ACCESS_TOKEN);
