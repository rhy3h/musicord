const {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
} = require("@discordjs/voice");

const playdl = require("play-dl");
const YoutubeURL = require("./youtubeURL");

class DiscordPlayer {
  constructor() {
    this.voiceChannel = null;
    this.musicIndex = 0;
    this.musicQueue = [];
    this.ytRegex =
      /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/gm;

    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
      },
    });

    this.player.on(AudioPlayerStatus.Idle, async () => {
      this.stop();
    });
  }

  setVoiceChannel(voiceChannel) {
    this.voiceChannel = voiceChannel;
  }

  async createNextAudioResource(url) {
    const stream = await playdl.stream(url, {
      discordPlayerCompatibility: true,
    });

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });

    return resource;
  }

  appendPlayList(playList) {
    for (const musicUrl of playList) {
      if (!musicUrl.match(this.ytRegex)) {
        continue;
      }
      this.musicQueue.push(new YoutubeURL(musicUrl.split("&")[0]));
    }
  }

  getPlayList() {
    if (this.musicQueue.length == 0) {
      return "";
    }

    let text = "```ansi\n";

    for (let i = 0, len = this.musicQueue.length; i < len; i++) {
      text += `${i == this.musicIndex ? "[2;45m" : "[0m"}${i + 1} ${
        this.musicQueue[i].url
      } \n`;
    }
    text += "```";
    return text;
  }

  async play_pause() {
    switch (this.player.state.status) {
      case AudioPlayerStatus.Playing: {
        this.player.pause();
        return;
      }
      case AudioPlayerStatus.Paused: {
        this.player.unpause();
        return;
      }
      case AudioPlayerStatus.Idle: {
        if (this.musicQueue.length == 0) {
          return;
        }
        const resource = await this.createNextAudioResource(
          this.musicQueue[this.musicIndex].url
        );
        this.player.play(resource);
        return;
      }
    }
  }
  async previous() {
    this.musicIndex =
      (this.musicIndex - 1 + this.musicQueue.length) % this.musicQueue.length;
    const resource = await this.createNextAudioResource(
      this.musicQueue[this.musicIndex].url
    );

    this.player.stop();
    this.player.play(resource);
  }

  async next() {
    this.musicIndex = (this.musicIndex + 1) % this.musicQueue.length;

    const resource = await this.createNextAudioResource(
      this.musicQueue[this.musicIndex].url
    );

    this.player.stop();
    this.player.play(resource);
  }

  stop() {
    this.player.stop();

    this.musicQueue.length = 0;
    this.musicIndex = 0;

    this.destroy();
  }

  destroy() {
    this.voiceChannel?.destroy();
    this.voiceChannel = null;
  }
}

module.exports = DiscordPlayer;
