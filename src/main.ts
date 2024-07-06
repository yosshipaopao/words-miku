import { Player } from "textalive-app-api";
import type { IPlayerApp, IVideo, IRenderingUnit } from "textalive-app-api";

let lastStartTimestamp = new Set<number>();
const animateWord = function (now: number, unit: IRenderingUnit) {
  if (unit.contains(now) && !lastStartTimestamp.has(unit.startTime)) {
    lastStartTimestamp.add(unit.startTime);
    document.querySelector("#text")!.textContent += unit.text;
  }
};

const player = new Player({ app: { token: "4fqZOz8070Qoevvu" } });

player.addListener({
  onPlay: () => console.log("再生開始"),
  onPause: () => console.log("再生一時停止"),
  onStop: () => console.log("再生終了（頭出し）"),
  onMediaSeek: (position: number) =>
    console.log("再生位置の変更:", position, "ミリ秒"),
  onTimeUpdate: (position: number) =>
    console.log("再生位置のアップデート:", position, "ミリ秒"),
  onThrottledTimeUpdate: (position: number) =>
    console.log("再生位置のアップデート:", position, "ミリ秒"),
  onAppReady: (app: IPlayerApp) => {
    if (!app.managed) {
      player.createFromSongUrl("https://piapro.jp/t/ELIC/20240130010349", {
        video: {
          // 音楽地図訂正履歴
          beatId: 4592299,
          chordId: 2727639,
          repetitiveSegmentId: 2824330,
          // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FELIC%2F20240130010349
          lyricId: 59419,
          lyricDiffId: 13966,
        },
      });
    }
  },
  onVideoReady: (v: IVideo) => {
    document.querySelector("#btn")!.addEventListener("click", () => {
      if (player.video) {
        player.isPlaying ? player.requestPause() : player.requestPlay();
      }
    });
    let w = v.firstWord;
    lastStartTimestamp = new Set();
    while (w) {
      w.animate = animateWord;
      w = w.next;
    }
  },
});
