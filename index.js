const { Events, Client, Collection, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");
const fs = require("fs");
const path = require("path");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.commands = new Collection();
client.buttons = new Collection();
client.modals = new Collection();
client.discordPlayers = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if (command.hasOwnProperty("data") && command.hasOwnProperty("execute")) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] Command at "${filePath}" is missing "data" or "execute".`
    );
  }
}

const buttonsPath = path.join(__dirname, "buttons");
const buttonFiles = fs
  .readdirSync(buttonsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of buttonFiles) {
  const filePath = path.join(buttonsPath, file);
  const button = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if (button.hasOwnProperty("id") && button.hasOwnProperty("execute")) {
    client.buttons.set(button.id, button);
  } else {
    console.log(
      `[WARNING] Button at "${filePath}" is missing "id" or "execute".`
    );
  }
}

const modalsPath = path.join(__dirname, "modals");
const modalFiles = fs
  .readdirSync(modalsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of modalFiles) {
  const filePath = path.join(modalsPath, file);
  const modal = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if (modal.hasOwnProperty("id") && modal.hasOwnProperty("execute")) {
    client.modals.set(modal.id, modal);
  } else {
    console.log(
      `[WARNING] Modal at "${filePath}" is missing "id" or "execute".`
    );
  }
}

// Discord bot on ready
client.once(Events.ClientReady, () => {
  console.log(`Discord Bot "${client.user.tag}" is ready!`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.log(`[ERROR] Command ${interaction.commandName} was not found.`);
      await interaction.update({});
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.update({});
    }
  }

  if (interaction.isButton()) {
    const button = interaction.client.buttons.get(interaction.customId);

    if (!button) {
      console.log(`[ERROR] Button ${interaction.customId} was not found.`);
      await interaction.update({});
      return;
    }

    try {
      await button.execute(interaction, client);
    } catch (error) {
      console.log(error);
      await interaction.update({});
    }
  }

  if (interaction.isModalSubmit()) {
    const modal = interaction.client.modals.get(interaction.customId);

    if (!modal) {
      console.log(`[ERROR] Modal ${interaction.customId} was not found.`);
      await interaction.update({});
      return;
    }

    try {
      await modal.execute(interaction, client);
    } catch (error) {
      console.log(error);
      await interaction.update({});
    }
  }
});

client.login(token);
