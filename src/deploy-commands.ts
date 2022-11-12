import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { clientId, token } from "./config.json";

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(token);

// and deploy your commands!
(async () => {
  try {
    // The put method is used to fully refresh all commands in the guild with the current set
    await rest.put(Routes.applicationCommands(clientId), {
      body: [
        new SlashCommandBuilder()
          .setName("player")
          .setDescription("Just a player")
          .setNameLocalizations({ "zh-TW": "播放列" })
          .setDescriptionLocalizations({ "zh-TW": "就是個播放器" })
          .toJSON(),
      ],
    });
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
