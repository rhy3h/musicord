import { ChatInputCommandInteraction } from "discord.js";

import { SlashCommand } from "../components/SlashCommand";
import { PlayBar } from "../components/PlayBar";

class PlayerCommand extends SlashCommand {
  constructor() {
    super();
    this.setName("player")
      .setDescription("Just a player")
      .setNameLocalizations({ "zh-TW": "播放列" })
      .setDescriptionLocalizations({ "zh-TW": "就是個播放器" });
  }

  public async execute(interaction: ChatInputCommandInteraction) {
    const playbar = new PlayBar();

    return await interaction.reply({
      embeds: [playbar.embed],
      components: [playbar.row],
    });
  }
}

module.exports = new PlayerCommand();
