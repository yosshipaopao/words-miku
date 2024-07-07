import {min, max, Word, Words, mouse} from "./utils.ts";
import {Player} from "textalive-app-api";
import Konva from "konva";
import type {IPlayerApp, IVideo} from "textalive-app-api";

window.onresize = () => {
    if (stage) {
        const base_size = min(window.innerWidth / 16, window.innerHeight / 9);
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

let tween: Konva.Tween;

player.addListener({
    onPlay: () => console.log("再生開始"),
    onPause: () => console.log("再生一時停止"),
    onStop: () => console.log("再生終了（頭出し）"),
    //onMediaSeek: (position: number) =>
    //    console.log("再生位置の変更:", position, "ミリ秒"),
    onTimeUpdate: (position: number) => {
        const se = max(up_words.searchTime(position), 0);
        if (tween) tween.destroy();
        if (progressbar_dragging) return;
        tween = new Konva.Tween({
            node: up_text_group,
            duration: .2,
            x: -up_words.positions[se],
        });
        tween.play();
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
        const base_size = min(window.innerWidth / 16, window.innerHeight / 9);
        stage = new Konva.Stage({
            container: 'app',
            width: base_size * 16,
            height: base_size * 9,
            scaleX: base_size / 120,
            scaleY: base_size / 120,
        });

        // BG
        bg_layer = new Konva.Layer();
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
            strokeWidth: 10 / stage.scaleY(),
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
            strokeWidth: 4 / stage.scaleX(),
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
            strokeWidth: 10 / stage.scaleY(),
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
            strokeWidth: 4 / stage.scaleX(),
            draggable: true,
        });
        progress_control.on("dragstart", () => progressbar_dragging = true);
        progress_control.on("dragend", () => {
            player.requestMediaSeek(progress_point.x() / stage.width() / 2 / stage.scaleX() * player.video.duration);
            progressbar_dragging = false;
        });
        progress_point.on("dragmove", () => {
            progress_point.y(0);
            progress_point.x(min(max(progress_point.x(), 0), stage.width() / 2 / stage.scaleX()));
        });
        progress_control.add(progress_point);
        control_group.add(progress_control);

        bg_layer.add(control_group);

        stage.add(bg_layer);

        // Main
        main_layer = new Konva.Layer();
        up_text_group = new Konva.Group({
            offsetY: -base_size / 2 / stage.scaleX(),
            offsetX: -stage.width() / 2 / stage.scaleX(),
        });
        main_layer.add(up_text_group);
        stage.add(main_layer);

        let w = v.firstWord;
        let x = 0;
        while (w) {
            const t = new Word(w);
            x += t.setPos(x) + 10 / stage.scaleX();
            up_text_group.add(t.text);
            up_words.add(t);
            w = w.next;
        }
    },
});

let stage: Konva.Stage;
let bg_layer: Konva.Layer;
let main_layer: Konva.Layer;
let up_text_group: Konva.Group;
let progress_point: Konva.Circle;
let up_words = new Words();
let progressbar_dragging = false;
