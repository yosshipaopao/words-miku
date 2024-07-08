"use strict";
import {min, max, Word, Words, mouse, colors} from "./utils.ts";
import {IChar, IPhrase, IWord, Player} from "textalive-app-api";
import Konva from "konva";
import type {IPlayerApp, IVideo} from "textalive-app-api";
import hexRgb from "hex-rgb";
import rgbHex from "rgb-hex";

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
        // Main
        main_layer = new Konva.Layer();
        focus_rect = new Konva.Rect({
            stroke: "black",
            strokeWidth: 4,
            dash: [10, 10]
        });
        main_layer.add(focus_rect);
        make_bg(bg_layer);
        stage.add(bg_layer);


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

        displaying_words_layer = new Konva.Layer({
            clipX: stage.width() / 9 / stage.scaleX(),
            clipY: stage.height() / 9 / stage.scaleY(),
            clipWidth: stage.width() * 7 / 9 / stage.scaleX(),
            clipHeight: stage.height() * 7 / 9 / stage.scaleY()
        });
        stage.add(displaying_words_layer);

        color_canvas_layer = new Konva.Layer();
        const canvas_layer_bg = new Konva.Rect({
            width: stage.width() / stage.scaleX(),
            height: stage.height() / stage.scaleY(),
            fill: "#000000aa",
        });
        color_canvas_layer.hide();
        canvas_layer_bg.on("click", ()=>{
            color_canvas_layer.hide();
        });
        color_canvas_layer.add(canvas_layer_bg);
        const color_canvas_group = new Konva.Group({
            x: stage.width() / 4 / stage.scaleX(),
            y: stage.height() / 4 / stage.scaleY()
        });
        const color_canvas_window_rect = new Konva.Rect({
            width: stage.width() / 2 / stage.scaleX(),
            height: stage.height() / 2 / stage.scaleY(),
            fill: "white",
            stroke: "black",
            strokeWidth: 10,
            cornerRadius: 20
        });
        color_canvas_group.add(color_canvas_window_rect);
        color_canvas_rect = new Konva.Rect({
            x: stage.width() / 16 /stage.scaleX(),
            y: stage.width() / 16 /stage.scaleY(),
            width: stage.width()  / 6 /stage.scaleX(),
            height: stage.width() / 6 /stage.scaleY(),
            fill: "white",
            stroke: "black",
            strokeWidth: 10
        });
        color_canvas_group.add(color_canvas_rect);
        color_canvas_layer.add(color_canvas_group);
        for(const i of [0,1,2]) {
            const r_group = new Konva.Group({
                x: (stage.width() / 3.5 + stage.width() / 15 * i) / stage.scaleX(),
                y: stage.width() / 16 / stage.scaleY()
            });
            const r_bar = new Konva.Line({
                points: [0, 0, 0, base_size * 2.5 / stage.scaleY()],
                stroke: 'red',
                strokeWidth: 10,
                lineCap: 'round',
                lineJoin: 'round',
            })
            r_group.add(r_bar);
            const r_point = new Konva.Circle({
                width: base_size * .4 / stage.scaleX(),
                height: base_size * .4 / stage.scaleY(),
                fill: 'white',
                stroke: 'black',
                strokeWidth: 4,
                draggable: true
            });
            r_point.on("mouseenter", mouse.pointer);
            r_point.on("mouseleave", mouse.default);
            r_point.on("dragmove", () => {
                r_point.x(0);
                r_point.y(min(max(r_point.y(), 0), base_size * 2.5 / stage.scaleY()));
                if(!selected_color_rect)return;
                const rgb = hexRgb(selected_color_rect.fill().toString(),{format:"array"});
                rgb[i] = r_point.y() / (base_size * 2.5 / stage.scaleY()) * 255;
                const hex = "#"+rgbHex(rgb[0],rgb[1],rgb[2],rgb[3]);
                selected_color_rect.fill(hex);
                color_canvas_rect.fill(hex);
                if(focussing_shape)focussing_shape.fill(hex);
            });
            r_group.add(r_point);
            color_canvas_points.push(r_point);
            color_canvas_group.add(r_group);
        }

        stage.add(color_canvas_layer);
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
    main_rect = new Konva.Rect({
        width: stage.width() * 7 / 9 / stage.scaleX(),
        height: stage.height() * 7 / 9 / stage.scaleX(),
        x: stage.width() / 9 / stage.scaleX(),
        y: base_size / stage.scaleY(),
        fill: "blue",
        stroke: "black",
        strokeWidth: 4,
    });
    main_rect.on("click", () => change_focus(main_rect));
    change_focus(main_rect);
    bg_layer.add(main_rect);
    const control_group = new Konva.Group({
        y: (stage.height() - base_size) / stage.scaleY(),
        offsetY: -base_size / 2 / stage.scaleY(),
    });
    make_control(control_group);
    bg_layer.add(control_group);
    const colorpalet_group = new Konva.Group({
        x: stage.width() * 8 / 9 / stage.scaleX(),
        y: base_size / stage.scaleY() + 20,
    });
    make_colorpalet(colorpalet_group);
    bg_layer.add(colorpalet_group);
    const transform_control_group = new Konva.Group({
        x: stage.width() / 2 / 9 / stage.scaleX(),
        y: base_size / stage.scaleY() + 20,
    });
    make_transform_control(transform_control_group);
    bg_layer.add(transform_control_group);
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
    const capture_button = new Konva.Circle({
        width: base_size * .8 / stage.scaleX(),
        height: base_size * .8 / stage.scaleX(),
        x: stage.width() * 8.5 / 9 / stage.scaleX(),
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4 / stage.scaleX(),
    });
    capture_button.on("mouseover", mouse.pointer);
    capture_button.on("mouseout", mouse.default);
    capture_button.on("click", () => {
        main_rect.strokeEnabled(false);
        change_focus(main_rect);
        (document.getElementById("img") as HTMLImageElement).src = stage.toDataURL({
            width: stage.width() * 7 / 9,
            height: stage.height() * 7 / 9,
            x: stage.width() / 9,
            y: base_size,
            pixelRatio: Math.ceil(1920 / stage.width())
        });
        main_rect.strokeEnabled(true);
    });
    control_group.add(capture_button);

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
const make_colorpalet = (colorpalet_group: Konva.Group) => {
    const size = stage.width() / 2 / 9 / stage.scaleX();
    for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        const rect = new Konva.Rect({
            x: (i % 2 == 0 ? 0 : 1) * (size) + size * .1,
            y: (Math.floor(i / 2)) * size,
            width: size * .8,
            height: size * .8,
            fill: color,
            stroke: "black",
            strokeWidth: 4
        });
        rect.on("mouseenter", mouse.pointer);
        rect.on("mouseleave", mouse.default);
        rect.on("click", () => {
            focussing_shape.fill(rect.fill());
        });
        rect.on("dblclick",()=>{
            open_color_canvas(rect);
        });
        colorpalet_group.add(rect);
    }
}
const make_transform_control = (transform_control_group: Konva.Group) => {
    const size_control_group = new Konva.Group({
        y: base_size / 2 / stage.scaleY(),
    });
    const size_control_bar = new Konva.Line({
        points: [0, 0, 0, base_size * 2.5 / stage.scaleY()],
        stroke: 'red',
        strokeWidth: 10,
        lineCap: 'round',
        lineJoin: 'round',
    })
    size_control_group.add(size_control_bar);
    size_control_point = new Konva.Circle({
        width: base_size * .4 / stage.scaleX(),
        height: base_size * .4 / stage.scaleX(),
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
    });
    size_control_point.on("mouseenter", mouse.pointer);
    size_control_point.on("mouseleave", mouse.default);
    size_control_point.on("dragmove", () => {
        size_control_point.x(0);
        size_control_point.y(min(max(size_control_point.y(), 0), base_size * 2.5 / stage.scaleY()));
        if (focussing_shape != main_rect) {
            let new_scale = 1.9;
            new_scale *= size_control_point.y() / (base_size * 2.5 / stage.scaleY());
            new_scale += .1;
            focussing_shape.scale({x: new_scale, y: new_scale});
            console.log("scale shape");
            transform_focus_rect();
        }
    });
    size_control_group.add(size_control_point);
    transform_control_group.add(size_control_group);
    const rotate_control_group = new Konva.Group({
        y: ((stage.height() - base_size) / 2) / stage.scaleY(),
    });
    const rotate_control_bar = new Konva.Line({
        points: [0, 0, 0, base_size * 2.5 / stage.scaleY()],
        stroke: 'red',
        strokeWidth: 10,
        lineCap: 'round',
        lineJoin: 'round',
    })
    rotate_control_group.add(rotate_control_bar);
    rotate_control_point = new Konva.Circle({
        width: base_size * .4 / stage.scaleX(),
        height: base_size * .4 / stage.scaleX(),
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4,
        draggable: true
    });
    rotate_control_point.on("mouseenter", mouse.pointer);
    rotate_control_point.on("mouseleave", mouse.default);
    rotate_control_point.on("dragmove", () => {
        rotate_control_point.x(0);
        rotate_control_point.y(min(max(rotate_control_point.y(), 0), base_size * 2.5 / stage.scaleY()));
        if (focussing_shape != main_rect) {
            focussing_shape.rotation(rotate_control_point.y() / (base_size * 2.5 / stage.scaleY()) * 360 - 180);
            transform_focus_rect();
        }
    });

    rotate_control_group.add(rotate_control_point);
    transform_control_group.add(rotate_control_group);
}
const create_words_group = (p: IPhrase | IWord | IChar): [Konva.Group, Words, null] => {
    let x = 0;
    const tmp: [Konva.Group, Words, null] = [new Konva.Group({
        x: stage.width() / 2 / stage.scaleX(),
        offsetY: -base_size / 2 / stage.scaleX(),
        offsetX: -stage.width() / 2 / stage.scaleX(),
    }), new Words(), null];
    while (p) {
        const t = new Word(p, tmp[1].count);
        t.text.on("pointerdown", () => {
            if (t.text.parent == displaying_words_layer) return;
            t.text.remove();
            displaying_words_layer.add(t.text);
            if (focussing_shape != main_rect) {
                t.text.fill(focussing_shape.fill());
                t.text.rotation(focussing_shape.rotation());
                t.text.scale(focussing_shape.scale());
            }
            t.text.absolutePosition(stage.getPointerPosition() ?? {x: 0, y: 0});
        });
        t.text.on("dragmove", () => {
            t.text.y(min(t.text.y(), (stage.height() - base_size) / stage.scaleY()));
            if (t.text.y() > base_size / stage.scaleY()) t.text.x(max(min(t.text.x(), (stage.width() * 8 / 9) / stage.scaleX()), stage.width() / 9 / stage.scaleX()));

        })
        t.text.on("dragend", () => {
            if (t.text.y() <= base_size / stage.scaleX()) {
                tmp[0].add(t.text);
                t.text.y(0);
                t.text.x(tmp[1].positions[t.index]);
                t.text.fill("green");
                t.text.rotation(0);
                t.text.scale({x: .6, y: .6});
                if (focussing_shape == t.text) change_focus(main_rect);
            } else change_focus(t.text);
        });
        t.text.on("click", () => change_focus(t.text));
        t.text.on("mouseover", () => {
            mouse.pointer();
            if (t.text.parent == displaying_words_layer) return;
            t.text.scale({x: .55, y: .55});
        });
        t.text.on("mouseout", () => {
            mouse.default();
            if (t.text.parent == displaying_words_layer) return;
            t.text.scale({x: .5, y: .5});
        });
        x += t.setPos(x) + 10;
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
const change_focus = (new_focussing_shape: Konva.Rect | Konva.Text) => {
    if (focussing_shape) focussing_shape.off("dragmove.focus");
    focussing_shape = new_focussing_shape;
    transform_focus_rect();
    focussing_shape.on("dragmove.focus", transform_focus_rect);
    if (!rotate_control_point || !size_control_point) return;
    rotate_control_point.y((focussing_shape.rotation() + 180) / 360 * (base_size * 2.5 / stage.scaleY()));
    size_control_point.y((focussing_shape.scaleX() - .1) / 1.9 * (base_size * 2.5 / stage.scaleY()));
}
const transform_focus_rect = () => {
    // resize
    focus_rect.width(focussing_shape.width() * focussing_shape.scaleX() + 8 / stage.scaleX());
    focus_rect.height(focussing_shape.height() * focussing_shape.scaleY() + 8 / stage.scaleY());
    // movement
    focus_rect.absolutePosition(focussing_shape.getAbsolutePosition());
    // rotate
    focus_rect.rotation(focussing_shape.getAbsoluteRotation());
    // offset
    focus_rect.offsetX(focussing_shape.offsetX() * focussing_shape.scaleX() + 4 / stage.scaleX());
    focus_rect.offsetY(focussing_shape.offsetY() * focussing_shape.scaleY() + 4 / stage.scaleY());
}
const open_color_canvas = (rect:Konva.Rect)=>{
    selected_color_rect = rect;
    const rgb = hexRgb(selected_color_rect.fill().toString(),{format:"array"});
    color_canvas_rect.fill(rect.fill());
    for(let i=0;i<3;i++)color_canvas_points[i].y(rgb[i]/255*(base_size * 2.5 / stage.scaleY()));
    color_canvas_layer.show();
}
let base_size: number;
let stage: Konva.Stage;
let main_layer: Konva.Layer;
let main_rect: Konva.Rect;
let displaying_words_layer: Konva.Layer;
let progress_point: Konva.Circle;
let words_mode = 2;
let words_groups: [Konva.Group, Words, Konva.Tween | null][] = [];
let progressbar_dragging = false;
let focussing_shape: Konva.Rect | Konva.Text;
let focus_rect: Konva.Rect;
let rotate_control_point: Konva.Circle;
let size_control_point: Konva.Circle;
let color_canvas_layer: Konva.Layer;
let color_canvas_rect: Konva.Rect;
let color_canvas_points: Konva.Circle[] = [];
let selected_color_rect: Konva.Rect;

// todo フォント選択
// todo 補助ライン
// todo 曲選択
// todo シェア
