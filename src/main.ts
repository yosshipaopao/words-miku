import {min, max, Word, Words, mouse} from "./utils.ts";
import {IChar, IPhrase, IWord, Player} from "textalive-app-api";
import Konva from "konva";
import type {IPlayerApp, IVideo} from "textalive-app-api";

window.onresize = () => {
    if (stage) {
        base_size = min(window.innerWidth / 16, window.innerHeight / 9);
        stage.width(base_size * 16);
        stage.height(base_size * 9);
        stage.scaleX(base_size / 120);
        stage.scaleY(base_size / 120);
    }
}

const player = new Player({
    app: {token: "4fqZOz8070Qoevvu"},
    mediaElement: document.getElementById("media") ?? "media",
    mediaBannerPosition: "bottom right"
});

player.addListener({
    onPlay: () => console.log("再生開始"),
    onPause: () => console.log("再生一時停止"),
    onStop: () => console.log("再生終了（頭出し）"),
    //onMediaSeek: (position: number) =>
    //    console.log("再生位置の変更:", position, "ミリ秒"),
    onTimeUpdate: (position: number) => {
        for (let i = 0; i < 3; i++) {
            const se = max(words_groups[i][1].searchTime(position), 0);
            words_groups[i][2]?.destroy();
            words_groups[i][2] = new Konva.Tween({
                node: words_groups[i][0],
                duration: .2,
                x: -words_groups[i][1].positions[se],
            });
            words_groups[i][2]?.play();
        }
        if (progressbar_dragging) return;
        progress_point.x(position / player.video.duration * stage.width() / 2 / stage.scaleX());
    },
    //onThrottledTimeUpdate: (position: number) =>
    //    console.log("再生位置のアップデート:", position, "ミリ秒"),
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
        base_size = min(window.innerWidth / 16, window.innerHeight / 9);
        stage = new Konva.Stage({
            container: 'app',
            width: base_size * 16,
            height: base_size * 9,
            scaleX: base_size / 120,
            scaleY: base_size / 120,
        });

        const bg_layer = new Konva.Layer();
        make_bg(bg_layer);
        stage.add(bg_layer);

        // Main
        main_layer = new Konva.Layer();

        // Phrase
        words_groups.push(create_words_group(v.firstPhrase));
        // Word
        words_groups.push(create_words_group(v.firstWord));
        // Char
        words_groups.push(create_words_group(v.firstChar));

        for (let i = 0; i < 3; i++) main_layer.add(words_groups[i][0]);
        change_words_mode(words_mode);
        console.log(words_groups);
        stage.add(main_layer);
    },
});

const make_bg = (bg_layer: Konva.Layer) => {
    // BG
    const bg_rect = new Konva.Rect({
        width: stage.width() / stage.scaleX(),
        height: stage.height() / stage.scaleX(),
        fill: 'white'
    });
    bg_layer.add(bg_rect);
    const up_line = new Konva.Rect({
        width: stage.width() / stage.scaleX(),
        height: base_size / stage.scaleX(),
        fill: 'yellow'
    });
    bg_layer.add(up_line);
    const down_line = new Konva.Rect({
        width: stage.width() / stage.scaleX(),
        height: base_size / stage.scaleX(),
        y: (stage.height() - base_size) / stage.scaleY(),
        fill: 'yellow'
    });
    bg_layer.add(down_line);
    const main_rect = new Konva.Rect({
        width: stage.width() * 7 / 9 / stage.scaleX(),
        height: stage.height() * 7 / 9 / stage.scaleX(),
        x: stage.width() / 9 / stage.scaleX(),
        y: base_size / stage.scaleY(),
        fill: "blue"
    });
    bg_layer.add(main_rect);
    const control_group = new Konva.Group({
        y: (stage.height() - base_size) / stage.scaleY(),
        offsetY: -base_size / 2 / stage.scaleY(),
    });
    make_control(control_group);
    bg_layer.add(control_group);
}
const make_control = (control_group: Konva.Group) => {
    const change_mode_button = new Konva.Circle({
        width: base_size * .8 / stage.scaleX(),
        height: base_size * .8 / stage.scaleX(),
        x: stage.width() / 18 / stage.scaleX(),
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4 / stage.scaleX(),
    });
    change_mode_button.on("mouseover", mouse.pointer);
    change_mode_button.on("mouseout", mouse.default);
    change_mode_button.on("click", () => {
        change_words_mode((words_mode + 1) % 3);
    });
    control_group.add(change_mode_button);
    const play_button = new Konva.Circle({
        width: base_size * .8 / stage.scaleX(),
        height: base_size * .8 / stage.scaleX(),
        x: stage.width() / 9 / stage.scaleX(),
        offsetX: -base_size / 2 / stage.scaleX(),
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4 / stage.scaleX(),
    });
    play_button.on("mouseover", mouse.pointer);
    play_button.on("mouseout", mouse.default);
    play_button.on("click", () => {
        if (player.video) player.isPlaying ? player.requestPause() : player.requestPlay();
    });
    control_group.add(play_button);

    const audio_control = new Konva.Group({
        x: stage.width() * 7 / 9 / stage.scaleX()
    });
    const audio_bar = new Konva.Line({
        points: [0, 0, stage.width() / 9 / stage.scaleX(), 0],
        stroke: 'red',
        strokeWidth: 10,
        lineCap: 'round',
        lineJoin: 'round',
    });
    audio_control.add(audio_bar);
    const audio_point = new Konva.Circle({
        x: stage.width() / 9 / stage.scaleX() * player.volume / 100,
        width: base_size * .4 / stage.scaleX(),
        height: base_size * .4 / stage.scaleX(),
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true,
    });
    audio_point.on("dragmove", () => {
        audio_point.y(0);
        audio_point.x(min(max(audio_point.x(), 0), stage.width() / 9 / stage.scaleX()));
        player.volume = audio_point.x() * 100 / (stage.width() / 9 / stage.scaleX());
    });
    audio_control.add(audio_point);
    control_group.add(audio_control);

    const progress_control = new Konva.Group({
        x: stage.width() * 2 / 9 / stage.scaleX()
    });
    const progress_bar = new Konva.Line({
        points: [0, 0, stage.width() / 2 / stage.scaleX(), 0],
        stroke: 'red',
        strokeWidth: 10,
        lineCap: 'round',
        lineJoin: 'round',
    });
    progress_control.add(progress_bar);
    progress_point = new Konva.Circle({
        x: 0,
        width: base_size * .4 / stage.scaleX(),
        height: base_size * .4 / stage.scaleX(),
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true,
    });
    progress_point.on("dragstart", () => progressbar_dragging = true);
    progress_point.on("dragend", () => {
        player.requestMediaSeek(progress_point.x() / (stage.width() / 2 / stage.scaleX()) * player.video.duration);
        progressbar_dragging = false;
    });
    progress_point.on("dragmove", () => {
        progress_point.y(0);
        progress_point.x(min(max(progress_point.x(), 0), stage.width() / 2 / stage.scaleX()));
    });
    progress_bar.on('pointerup', () => {
        let pos = stage.getPointerPosition()?.x;
        if (!pos) return;
        pos -= progress_bar.getAbsolutePosition().x;
        pos /= stage.scaleX();
        progress_point.x(pos);
        player.requestMediaSeek(pos / (stage.width() / 2 / stage.scaleX()) * player.video.duration);
    });
    progress_control.add(progress_point);
    control_group.add(progress_control);
}
const create_words_group = (p: IPhrase | IWord | IChar): [Konva.Group, Words, null] => {
    let x = 0;
    const tmp: [Konva.Group, Words, null] = [new Konva.Group({
        offsetY: -base_size / 2 / stage.scaleX(),
        offsetX: -stage.width() / 2 / stage.scaleX(),
    }), new Words(), null];
    while (p) {
        const t = new Word(p, tmp[1].count);
        t.text.on("pointerdown", () => {
            if (t.text.parent == main_layer) return;
            t.text.remove();
            main_layer.add(t.text);
            t.text.absolutePosition(stage.getPointerPosition() ?? {x: 0, y: 0});
        });
        t.text.on("dragend",()=>{
            if (t.text.y() <= base_size / stage.scaleX()){
                tmp[0].add(t.text);
                t.text.y(0);
                t.text.x(tmp[1].positions[t.index])
            }
        })
        t.text.on("mouseover", () => {
            mouse.pointer();
            if (t.text.parent == main_layer) return;
            t.text.scale({x: 1.2, y: 1.2});
        });
        t.text.on("mouseout", () => {
            mouse.default();
            if (t.text.parent == main_layer) return;
            t.text.scale({x: 1, y: 1})
        });
        x += t.setPos(x) + 10 / stage.scaleX();
        tmp[0].add(t.text);
        tmp[1].add(t);
        p = p.next;
    }
    return tmp;
}
const change_words_mode = (new_mode: number) => {
    words_mode = new_mode;
    for (let i = 0; i < 3; i++) {
        if (i != words_mode) words_groups[i][0].hide();
        else words_groups[i][0].show();
    }
}

let base_size: number;
let stage: Konva.Stage;
let main_layer: Konva.Layer;
let progress_point: Konva.Circle;
let words_mode = 2;
let words_groups: [Konva.Group, Words, Konva.Tween | null][] = [];
let progressbar_dragging = false;
