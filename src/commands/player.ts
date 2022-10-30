import { createAudioResource, AudioPlayer } from "@discordjs/voice";

import * as playdl from "play-dl";

class Player extends AudioPlayer {
  constructor() {
    super();
  }

  private async getAudioResource(url: string) {
    const stream = await playdl.stream(url, {
      discordPlayerCompatibility: true,
    });

    const resource = createAudioResource(stream.stream, {
      inputType: stream.type,
    });

    return resource;
  }

  public async playSong(url: string) {
    this.play(await this.getAudioResource(url));
  }
}

export { Player };
