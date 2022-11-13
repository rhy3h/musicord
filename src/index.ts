import { Events, GatewayIntentBits } from "discord.js";

import { DcClient } from "./utilities/dc-client";
import { DcPlayer } from "./utilities/dc-player";

import { token } from "./config.json";

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
      await interaction.reply({ content: err.message });
      setTimeout(async () => {
        await interaction.deleteReply();
      }, timeout);
    });
  }
  if (interaction.isModalSubmit()) {
    await dcPlayer.executeSubmit(interaction).catch(async (err: Error) => {
      await interaction.reply({ content: err.message });
      setTimeout(async () => {
        await interaction.deleteReply();
      }, timeout);
    });
  }
});

client.login(token);
