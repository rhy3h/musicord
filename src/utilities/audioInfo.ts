class AudioInfo {
  public url: string;
  public title: string;
  public durationInMins: string;

  constructor(title: string, url: string, durationInMins: number) {
    this.title = title;
    this.url = url;
    let min = Math.ceil(durationInMins / 60);
    let sec = (durationInMins % 60).toString().padStart(2, "0");
    this.durationInMins = `${min}:${sec}`;
  }

  get audioText() {
    return `${this.title} ${this.durationInMins}`;
  }
}

export { AudioInfo };
