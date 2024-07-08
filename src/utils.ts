"use strict";
import Konva from "konva";
import type {ITextUnit, PlayerVideoOptions} from "textalive-app-api";

export function min(a: number, b: number) {
    return a < b ? a : b;
}

export function max(a: number, b: number) {
    return a > b ? a : b;
}

export const mouse = {
    default: () => document.body.style.cursor = "default",
    pointer: () => document.body.style.cursor = "pointer",
}

export const new_up_text = (t: string): Konva.Text => {
    const text = new Konva.Text({
        text: t,
        scale: {x: .5, y: .5},
        fontSize: 120,
        fontFamily: fonts[0],
        fill: "#000000",
        draggable: true,
        closed: true
        //rotation: 45
    });
    text.offsetX(text.width() / 2);
    text.offsetY(text.height() / 2);
    return text;
}

export class Word {
    text: Konva.Text;
    word: ITextUnit;
    index: number;

    get time() {
        return this.word.startTime;
    }

    constructor(word: ITextUnit, index: number) {
        this.word = word;
        this.text = new_up_text(word.text);
        this.index = index;
    }

    setPos(x: number): number {
        this.text.x(x + this.text.width() / 2 * this.text.scaleX());
        return this.text.width() * this.text.scaleX();
    }
}

export class Words {
    words: Word[] = [];
    times: number[] = [];
    positions: number[] = [];

    get count() {
        return this.words.length;
    }

    constructor() {
    }

    add(word: Word) {
        this.words.push(word);
        this.times.push(word.time);
        this.positions.push(word.text.x());
    }

    searchTime(time: number): number {
        let left = 0,
            right = this.times.length - 1;

        while (left <= right) {
            // 探索配列の中間のindex
            const mid = Math.floor((left + right) / 2);
            if (time < this.times[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        return min(left - 1, this.times.length - 1);
    }

    searchPos(pos: number): number {
        let left = 0,
            right = this.positions.length - 1;

        while (left <= right) {
            // 探索配列の中間のindex
            const mid = Math.floor((left + right) / 2);
            if (pos < this.positions[mid]) {
                right = mid - 1;
            } else {
                left = mid + 1;
            }
        }
        return min(left - 1, this.positions.length - 1);
    }
}

export const colors = [
    "#ffffff",
    "#000000",
    "#008899",
    "#dd88bb",
    "#eeaa00",
    "#ffee77",
    "#6655cc",
    "#cb213c",
];
export const fonts = [
    "M PLUS 1p",
    "Sawarabi Mincho",
    "Dela Gothic One",
    "Zen Kurenaido"
];

class Song {
    title: string
    url: string;
    options: PlayerVideoOptions;

    constructor(title: string, url: string, options: PlayerVideoOptions) {
        this.title = title;
        this.url = url;
        this.options = options;
    }
}

export const songs = [
    new Song(
        "SUPERHERO / めろくる",
        "https://piapro.jp/t/hZ35/20240130103028",
        {
            video: {
                // 音楽地図訂正履歴
                beatId: 4592293,
                chordId: 2727635,
                repetitiveSegmentId: 2824326,
                // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FhZ35%2F20240130103028
                lyricId: 59415,
                lyricDiffId: 13962
            },
        }),
    new Song(
        "いつか君と話したミライは / タケノコ少年",
        "https://piapro.jp/t/--OD/20240202150903",
        {
            video: {
                // 音楽地図訂正履歴
                beatId: 4592296,
                chordId: 2727636,
                repetitiveSegmentId: 2824327,
                // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2F--OD%2F20240202150903
                lyricId: 59416,
                lyricDiffId: 13963
            },
        }),
    new Song(
        "フューチャーノーツ / shikisai",
        "https://piapro.jp/t/XiaI/20240201203346",
        {
            video: {
                // 音楽地図訂正履歴
                beatId: 4592297,
                chordId: 2727637,
                repetitiveSegmentId: 2824328,
                // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FXiaI%2F20240201203346
                lyricId: 59417,
                lyricDiffId: 13964
            },
        }),
    new Song(
        "未来交響曲 / ヤマギシコージ",
        "https://piapro.jp/t/Rejk/20240202164429",
        {
            video: {
                // 音楽地図訂正履歴
                beatId: 4592298,
                chordId: 2727638,
                repetitiveSegmentId: 2824329,
                // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FRejk%2F20240202164429
                lyricId: 59418,
                lyricDiffId: 13965
            }
        }),
    new Song(
        "リアリティ / 歩く人",
        "https://piapro.jp/t/ELIC/20240130010349",
        {
            video: {
                // 音楽地図訂正履歴
                beatId: 4592299,
                chordId: 2727639,
                repetitiveSegmentId: 2824330,
                // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FELIC%2F20240130010349
                lyricId: 59419,
                lyricDiffId: 13966
            },
        }),
    new Song(
        "The Marks / 2ouDNS",
        "https://piapro.jp/t/xEA7/20240202002556",
        {
            video: {
                // 音楽地図訂正履歴
                beatId: 4592300,
                chordId: 2727640,
                repetitiveSegmentId: 2824331,
                // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FxEA7%2F20240202002556
                lyricId: 59420,
                lyricDiffId: 13967
            },
        }
    )

];