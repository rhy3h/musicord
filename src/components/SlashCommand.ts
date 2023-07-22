import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

abstract class SlashCommand extends SlashCommandBuilder {
  constructor() {
    super();
  }

  abstract execute(interaction: ChatInputCommandInteraction): Promise<any>;
}

export { SlashCommand };
