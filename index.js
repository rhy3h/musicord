const {
  REST,
  Routes,
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
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
  new SlashCommandBuilder()
    .setName("播放")
    .setDescription("播放歌曲")
    .addStringOption((option) =>
      option.setName("網址").setDescription("Youtube 網址").setRequired(true)
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(config.Discord.Token);

// Discord bot on ready
client.on("ready", () => {
  console.log(`機器人 "${client.user.tag}" 運行了!`);
  console.log(generateDependencyReport());
});

const musicQueue = [];
var player = createAudioPlayer({
  behaviors: {
    noSubscriber: NoSubscriberBehavior.Play,
  },
});
var connection = null;
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, member, guildId } = interaction;
  switch (commandName) {
    case "播放": {
      const url = interaction.options.getString("網址");

      // Not in a voice channel
      if (!member.voice.channelId) {
        await interaction.reply("先進到一個語音頻道");
        return;
      }

      // Youtube regex
      const ytRegex =
        /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gm;
      // Not match youtube url
      if (!url.match(ytRegex)) {
        await interaction.reply("奇怪的網址");
        setTimeout(() => interaction.deleteReply(), 5 * 1000);
        return;
      }

      // If bot is in a channel, push into a queue
      if (getVoiceConnections().get(guildId)) {
        musicQueue.push(url);
        await interaction.reply("新增到播放清單");
        setTimeout(() => interaction.deleteReply(), 5 * 1000);
        return;
      }

      let stream = await playdl.stream(url, {
        discordPlayerCompatibility: true,
      });

      const resource = createAudioResource(stream.stream, {
        inputType: stream.type,
      });

      if (!connection) {
        connection = joinVoiceChannel({
          channelId: member.voice.channelId,
          guildId: guildId,
          adapterCreator: member.voice.channel.guild.voiceAdapterCreator,
        });
        connection.subscribe(player);
      }

      player.play(resource);

      player.on(AudioPlayerStatus.Idle, async () => {
        if (musicQueue.length == 0) {
          connection?.destroy();
          connection = null;
          return;
        }

        const url = musicQueue.shift();
        const stream = await playdl.stream(url, {
          discordPlayerCompatibility: true,
        });
        const resource = createAudioResource(stream.stream, {
          inputType: stream.type,
        });
        player.play(resource);
      });

      // Remove parameter, then send message
      await interaction.reply(`${url.split("&")[0]}`);
      setTimeout(() => interaction.deleteReply(), 5 * 1000);

      break;
    }
  }
});

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
