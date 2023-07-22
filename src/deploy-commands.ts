import { REST, Routes } from "discord.js";
import fs from "fs/promises";
import path from "path";
import { config } from "dotenv";

config();

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(
  process.env.MUSICORD_ACCESS_TOKEN as string
);

(async () => {
  const commands = [];

  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = (await fs.readdir(commandsPath)).filter((file) =>
    file.endsWith(".ts")
  );
  // Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
  for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.toJSON());
  }

  try {
    // The put method is used to fully refresh all commands in the guild with the current set
    await rest.put(
      Routes.applicationCommands(process.env.MUSICORD_CLIENT_ID as string),
      {
        body: commands,
      }
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
