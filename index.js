const {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextInputBuilder,
  TextInputStyle,
  ModalBuilder,
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  getVoiceConnections,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  generateDependencyReport,
} = require("@discordjs/voice");

const playdl = require("play-dl");
const fs = require("fs");

let configJson = fs.readFileSync("./config.json");
let config = JSON.parse(configJson);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const commands = [
  new SlashCommandBuilder().setName("控制列").setDescription("播放選項"),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(config.Discord.Token);

// Discord bot on ready
client.on("ready", () => {
  console.log(`機器人 "${client.user.tag}" 運行了!`);
  console.log(generateDependencyReport());
});

async function createNextAudioResource(url) {
  const stream = await playdl.stream(url, {
    discordPlayerCompatibility: true,
  });

  const resource = createAudioResource(stream.stream, {
    inputType: stream.type,
  });

  return resource;
}

let musicIndex = 0;
// TODO: YT class
const musicQueue = [];
var player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play,
  },
});
var connection = null;
player.on(AudioPlayerStatus.Idle, async () => {
  connection?.destroy();
  connection = null;
});
client.on("interactionCreate", async (interaction) => {
  const { commandName, member, guildId } = interaction;
  const memberUserId = member.user.id;
  if (interaction.isChatInputCommand()) {
    switch (commandName) {
      case "控制列": {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("previous_button")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("⏮️"),
          new ButtonBuilder()
            .setCustomId("play_pause_button")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("▶️"),
          new ButtonBuilder()
            .setCustomId("next_button")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("⏭️"),
          new ButtonBuilder()
            .setCustomId("stop_button")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("⏹️"),
          new ButtonBuilder()
            .setCustomId("plus_button")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji("➕")
        );

        const embed = new EmbedBuilder()
          .setColor(0x0099ff)
          .setTitle("播放清單");

        await interaction.reply({
          embeds: [embed],
          components: [row],
        });

        break;
      }
    }
  }
  if (interaction.isButton()) {
    let playSong = async () => {
      const url = musicQueue[musicIndex];
      const resource = await createNextAudioResource(url);
      player.play(resource);

      interaction.message.embeds[0].data.description = updatePlayList(
        musicQueue,
        musicIndex
      );
      await interaction.update({
        embeds: interaction.message.embeds,
      });
    };
    switch (interaction.customId) {
      case "play_pause_button": {
        switch (player.state.status) {
          case AudioPlayerStatus.Playing: {
            player.pause();
            interaction.component.emoji.name = "▶️";
            await interaction.update({
              components: interaction.message.components,
            });
            break;
          }
          case AudioPlayerStatus.Paused: {
            player.unpause();
            interaction.component.emoji.name = "⏸️";
            await interaction.update({
              components: interaction.message.components,
            });
            break;
          }
          default: {
            if (musicQueue.length == 0) {
              await interaction.update({});
              return;
            }
            if (!connection) {
              connection = joinVoiceChannel({
                channelId: member.voice.channelId,
                guildId: guildId,
                adapterCreator: member.voice.channel.guild.voiceAdapterCreator,
              });
              connection.subscribe(player);
            }
            const resource = await createNextAudioResource(
              musicQueue[musicIndex]
            );
            player.play(resource);

            interaction.component.emoji.name = "⏸️";
            await interaction.update({
              components: interaction.message.components,
            });
            break;
          }
        }

        break;
      }
      case "previous_button": {
        musicIndex = (musicIndex - 1 + musicQueue.length) % musicQueue.length;
        await playSong();
        break;
      }
      case "next_button": {
        musicIndex = (musicIndex + 1) % musicQueue.length;
        await playSong();
        break;
      }
      case "stop_button": {
        player.stop();
        connection?.destroy();
        connection = null;

        musicQueue.length = 0;
        musicIndex = 0;
        interaction.message.embeds[0].data.description = updatePlayList(
          musicQueue,
          musicIndex
        );
        await interaction.update({
          embeds: interaction.message.embeds,
        });
        break;
      }
      case "plus_button": {
        const modal = new ModalBuilder()
          .setCustomId("url_modal")
          .setTitle("Url");

        const urlInput = new TextInputBuilder()
          .setCustomId("input_url")
          .setLabel("What do you want to play")
          .setStyle(TextInputStyle.Paragraph);

        modal.addComponents(new ActionRowBuilder().addComponents(urlInput));

        await interaction.showModal(modal);

        break;
      }
    }
  }
  if (interaction.isModalSubmit()) {
    const input_urls = interaction.fields
      .getTextInputValue("input_url")
      .split("\n");

    for (let i = 0, len = input_urls.length; i < len; i++) {
      const url = input_urls[i].split("&")[0];

      // Youtube regex
      const ytRegex =
        /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gm;
      // Not match youtube url
      if (!url.match(ytRegex)) {
        continue;
      }
      musicQueue.push(url);
    }

    interaction.message.embeds[0].data.description = updatePlayList(
      musicQueue,
      musicIndex
    );
    await interaction.update({
      embeds: interaction.message.embeds,
    });
  }
});

function updatePlayList(musicQueue, musicIndex) {
  if (musicQueue.length == 0) {
    return "";
  }

  let text = "```ansi\n";

  for (let i = 0, len = musicQueue.length; i < len; i++) {
    text += `${i == musicIndex ? "[2;45m" : "[0m"}${i + 1} ${musicQueue[i]} \n`;
  }
  text += "```";
  return text;
}
async function main() {
  // Regist several commands
  let data = await rest
    .put(
      Routes.applicationGuildCommands(
        config.Discord.APP_ID,
        config.Discord.Server_ID
      ),
      { body: commands }
    )
    .catch(console.error);
  console.log(`成功註冊 ${data.length} 條指令`);

  client.login(config.Discord.Token);
}

main();
