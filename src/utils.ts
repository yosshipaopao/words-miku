import Konva from "konva";
import type {IWord} from "textalive-app-api";

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
        fontSize: 60,
        fontFamily: 'Calibri',
        fill: 'green',
        draggable: true
    });
    text.offsetX(text.width() / 2);
    text.offsetY(text.height() / 2);
    text.on("mouseover", () => {
        mouse.pointer();
        text.scale({
            x: 1.2,
            y: 1.2
        });
    });
    text.on("mouseout", () => {
        mouse.default();
        text.scale({
            x: 1,
            y: 1
        })
    });
    return text;
}

export class Word {
    text: Konva.Text;
    word: IWord;

    get time() {
        return this.word.startTime;
    }

    constructor(word: IWord) {
        this.word = word;
        this.text = new_up_text(word.text);
    }

    setPos(x: number): number {
        this.text.x(x + this.text.width() / 2);
        return this.text.width();
    }
}

export class Words {
    words: Word[] = [];
    times: number[] = [];
    positions: number[] = [];

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