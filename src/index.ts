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

  const timeout = 5 * 1000; // ms
  // Slash Commands
  if (interaction.isChatInputCommand()) {
    client.executeChatInputCommand(interaction);
  }

  if (interaction.isButton()) {
    await dcPlayer.executeButton(interaction).catch(async (err) => {
      if (interaction.replied) {
        await interaction.deleteReply();
        return;
      }
    });
  }
  if (interaction.isModalSubmit()) {
    await dcPlayer.executeSubmit(interaction).catch(() => {});
  }
});

client.login(process.env.MUSICORD_ACCESS_TOKEN);
