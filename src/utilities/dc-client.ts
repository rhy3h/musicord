import {
  ChatInputCommandInteraction,
  Client,
  ClientOptions,
  Collection,
  SlashCommandBuilder,
} from "discord.js";
import fs from "fs/promises";
import path from "path";

import { SlashCommand } from "../components/SlashCommand";
import { DcPlayer } from "./dc-player";

class DcClient extends Client {
  public commands: Collection<string, SlashCommandBuilder>;
  public dcPlayers: Collection<string, DcPlayer>;

  constructor(options: ClientOptions) {
    super(options);

    this.commands = new Collection();
    this.dcPlayers = new Collection();

    this.initCommands();
  }

  private async initCommands() {
    const commandsPath = path.join(__dirname, "../commands");
    const commandFiles = (await fs.readdir(commandsPath)).filter((file) =>
      file.endsWith(".ts")
    );

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ("name" in command && "execute" in command) {
        this.commands.set(command.name, command);
        console.log(`[SUCCESS] The command '${command.name}' registered`);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
      console.log("");
    }
  }

  public executeChatInputCommand(interaction: ChatInputCommandInteraction) {
    if (!interaction.guildId) {
      return;
    }

    const slashCommand = <SlashCommand>(
      this.commands.get(interaction.commandName)
    );
    slashCommand?.execute(interaction);
  }
}

export { DcClient };
