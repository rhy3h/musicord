import { Client, ClientOptions, Collection } from "discord.js";
import { DcPlayer } from "./dc-player";

class DcClient extends Client {
  public dcPlayers: Collection<string, DcPlayer>;

  constructor(options: ClientOptions) {
    super(options);

    this.dcPlayers = new Collection();
  }
}

export { DcClient };
