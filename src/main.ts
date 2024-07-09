"use strict";
import "./style.css";
import {colors, fonts, max, min, mouse, songs, Word, Words} from "./utils.ts";
import type {IVideo} from "textalive-app-api";
import {IChar, IPhrase, IWord, Player} from "textalive-app-api";
import Konva from "konva";
import hexRgb from "hex-rgb";
import rgbHex from "rgb-hex";

const song_select = document.getElementById("song_select") as HTMLSelectElement;
const song_select_btn = document.getElementById("song_select_btn") as HTMLButtonElement;

for (let i = 0; i < songs.length; i++) {
    const idx = i;
    const song = songs[i];
    const option = document.createElement("option");
    option.textContent = song.title;
    option.value = idx.toString();
    song_select.add(option);
}
song_select_btn.onclick = async () => {
    const song = songs[parseInt(song_select.value)];
    await player.createFromSongUrl(song.url, song.options);
}

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
    //onAppReady: (app: IPlayerApp) => {},
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
        canvas_layer_bg.on("click tap", () => {
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
            x: stage.width() / 16 / stage.scaleX(),
            y: stage.width() / 16 / stage.scaleY(),
            width: stage.width() / 6 / stage.scaleX(),
            height: stage.width() / 6 / stage.scaleY(),
            fill: "white",
            stroke: "black",
            strokeWidth: 10
        });
        color_canvas_group.add(color_canvas_rect);
        color_canvas_layer.add(color_canvas_group);
        for (const i of [0, 1, 2]) {
            const r_group = new Konva.Group({
                x: (stage.width() / 3.5 + stage.width() / 15 * i) / stage.scaleX(),
                y: stage.width() / 16 / stage.scaleY()
            });
            const r_bar = new Konva.Line({
                points: [0, 0, 0, base_size * 2.5 / stage.scaleY()],
                stroke: ["red", "blue", "green"][i],
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
                if (!selected_color_rect) return;
                const rgb = hexRgb(selected_color_rect.fill().toString(), {format: "array"});
                rgb[i] = r_point.y() / (base_size * 2.5 / stage.scaleY()) * 255;
                const hex = "#" + rgbHex(rgb[0], rgb[1], rgb[2], rgb[3]);
                selected_color_rect.fill(hex);
                color_canvas_rect.fill(hex);
                if (focussing_shape) focussing_shape.fill(hex);
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
        fill: '#008899'
    });
    bg_layer.add(up_line);
    const down_line = new Konva.Rect({
        width: stage.width() / stage.scaleX(),
        height: base_size / stage.scaleX(),
        y: (stage.height() - base_size) / stage.scaleY(),
        fill: '#008899'
    });
    bg_layer.add(down_line);
    main_rect = new Konva.Rect({
        width: stage.width() * 7 / 9 / stage.scaleX(),
        height: stage.height() * 7 / 9 / stage.scaleX(),
        x: stage.width() / 9 / stage.scaleX(),
        y: base_size / stage.scaleY(),
        fill: "#ffffff",
        stroke: "#000000",
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
    const font_control_group = new Konva.Group({
        x: stage.width() * 8 / 9 / stage.scaleX(),
        y: base_size / stage.scaleY() + stage.width() / 3 / stage.scaleY(),
    });
    make_font_control(font_control_group);
    bg_layer.add(font_control_group);
    const transform_control_group = new Konva.Group({
        x: stage.width() / 2 / 9 / stage.scaleX(),
        y: base_size / stage.scaleY() + 20,
    });
    make_transform_control(transform_control_group);
    bg_layer.add(transform_control_group);
}
const make_control = (control_group: Konva.Group) => {
    // Change Mode
    const change_mode_group = new Konva.Group({
        x: stage.width() / 18 / stage.scaleX()
    });
    change_mode_group.on("mouseover", mouse.pointer);
    change_mode_group.on("mouseout", mouse.default);
    change_mode_group.on("click tap", () => {
        change_words_mode((words_mode + 1) % 3);
    });
    const change_mode_button = new Konva.Circle({
        width: base_size * .8 / stage.scaleX(),
        height: base_size * .8 / stage.scaleX(),
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4 / stage.scaleX(),
    });
    change_mode_group.add(change_mode_button);
    Konva.Image.fromURL("/switch.png", (Node) => {
        Node.setAttrs({
            width: base_size * .666 / stage.scaleX(),
            height: base_size * .666 / stage.scaleX(),
            offsetX: base_size / 3 / stage.scaleX(),
            offsetY: base_size / 3 / stage.scaleY()
        });
        change_mode_group.add(Node);
    });
    control_group.add(change_mode_group);

    // Play
    const play_group = new Konva.Group({
        x: stage.width() / 9 / stage.scaleX(),
    })
    play_group.on("mouseover", mouse.pointer);
    play_group.on("mouseout", mouse.default);
    play_group.on("click tap", () => {
        if (player.video) player.isPlaying ? player.requestPause() : player.requestPlay();
    });
    const play_button = new Konva.Circle({
        width: base_size * .8 / stage.scaleX(),
        height: base_size * .8 / stage.scaleX(),
        offsetX: -base_size / 2 / stage.scaleX(),
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4 / stage.scaleX(),
    });
    play_group.add(play_button);
    const play_triangle = new Konva.RegularPolygon({
        x: base_size / 2 / stage.scaleX(),
        fill: "black",
        sides: 3,
        radius: 13 / stage.scaleX(),
        rotation: 90
    });
    play_group.add(play_triangle);
    control_group.add(play_group);
    // Capture
    const capture_group = new Konva.Group({
        x: stage.width() * 8.5 / 9 / stage.scaleX(),
    });
    capture_group.on("mouseover", mouse.pointer);
    capture_group.on("mouseout", mouse.default);
    capture_group.on("click tap", () => {
        main_rect.strokeEnabled(false);
        change_focus(main_rect);
        img_el.src = stage.toDataURL({
            width: stage.width() * 7 / 9,
            height: stage.height() * 7 / 9,
            x: stage.width() / 9,
            y: base_size,
            pixelRatio: Math.ceil(1920 / stage.width())
        });
        show_share_modal();
        main_rect.strokeEnabled(true);
    });
    const capture_button = new Konva.Circle({
        width: base_size * .8 / stage.scaleX(),
        height: base_size * .8 / stage.scaleX(),
        fill: 'white',
        stroke: 'black',
        strokeWidth: 4 / stage.scaleX(),
    });
    capture_group.add(capture_button);
    Konva.Image.fromURL("/camera.png", (Node) => {
        Node.setAttrs({
            width: base_size * .666 / stage.scaleX(),
            height: base_size * .666 / stage.scaleX(),
            offsetX: base_size / 3 / stage.scaleX(),
            offsetY: base_size / 3 / stage.scaleY()
        });
        capture_group.add(Node);
    });
    control_group.add(capture_group);

    const audio_control = new Konva.Group({
        x: stage.width() * 7 / 9 / stage.scaleX()
    });
    const audio_bar = new Konva.Line({
        points: [0, 0, stage.width() / 9 / stage.scaleX(), 0],
        stroke: '#eeaa00',
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
        stroke: '#eeaa00',
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
        rect.on("click tap", () => {
            focussing_shape.fill(rect.fill());
        });
        rect.on("dblclick dbltap", () => {
            open_color_canvas(rect);
        });
        colorpalet_group.add(rect);
    }
}
const make_font_control = (font_control_group: Konva.Group) => {
    const size = stage.width() / 2 / 9 / stage.scaleX();
    for (let i = 0; i < fonts.length; i++) {
        const font = fonts[i];
        const group = new Konva.Group({
            x: (i % 2 == 0 ? 0 : 1) * (size) + size * .1,
            y: (Math.floor(i / 2)) * size,
        });
        group.on("mouseenter", mouse.pointer);
        group.on("mouseleave", mouse.default);
        group.on("click tap", () => {
            if (focussing_shape == main_rect) return;
            (focussing_shape as Konva.Text).fontFamily(font);
        });
        const rect = new Konva.Rect({
            width: size * .8,
            height: size * .8,
            fill: "white",
            stroke: "black",
            strokeWidth: 4
        });
        group.add(rect);

        const text = new Konva.Text({
            fill: "black",
            fontFamily: font,
            fontSize: size * .8,
            text: "あ"
        });
        group.add(text);
        font_control_group.add(group);
    }
}
const make_transform_control = (transform_control_group: Konva.Group) => {
    const size_control_group = new Konva.Group({
        y: base_size / 2 / stage.scaleY(),
    });
    const size_control_bar = new Konva.Line({
        points: [0, 0, 0, base_size * 2.5 / stage.scaleY()],
        stroke: '#ffee77',
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
        stroke: '#ffee77',
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
        t.text.on("pointerdown touchstart", () => {
            if (t.text.parent == displaying_words_layer) return;
            t.text.remove();
            displaying_words_layer.add(t.text);
            if (focussing_shape != main_rect) {
                t.text.fill(focussing_shape.fill());
                t.text.rotation(focussing_shape.rotation());
                t.text.scale(focussing_shape.scale());
                t.text.fontFamily((focussing_shape as Konva.Text).fontFamily());
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
                t.text.fill("#000000");
                t.text.rotation(0);
                t.text.scale({x: .6, y: .6});
                if (focussing_shape == t.text) change_focus(main_rect);
            } else change_focus(t.text);
        });
        t.text.on("click tap", () => change_focus(t.text));
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
const open_color_canvas = (rect: Konva.Rect) => {
    selected_color_rect = rect;
    const rgb = hexRgb(selected_color_rect.fill().toString(), {format: "array"});
    color_canvas_rect.fill(rect.fill());
    for (let i = 0; i < 3; i++) color_canvas_points[i].y(rgb[i] / 255 * (base_size * 2.5 / stage.scaleY()));
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

// todo 補助ライン <- なし

const img_el = document.getElementById("img") as HTMLImageElement;
const shareBG = document.getElementById("bg");
const shareContent = document.getElementById("share");
shareBG!.onclick = () => {
    shareBG!.style.display = "none";
    shareContent!.style.display = "none";
}
const show_share_modal = () => {
    shareBG!.style.display = "block";
    shareContent!.style.display = "flex";
}
const save_btn = document.getElementById("save_btn") as HTMLButtonElement;
const copy_btn = document.getElementById("copy_btn") as HTMLButtonElement;
const share_btn = document.getElementById("share_btn") as HTMLButtonElement;


save_btn.onclick = () => {
    const downloadImage = document.createElement("a");
    document.body.appendChild(downloadImage);
    downloadImage.setAttribute("download", "image");
    downloadImage.href = img_el.src;
    downloadImage.click();
    downloadImage.remove();
}

copy_btn.onclick = async () => {
    const res = await fetch(img_el.src);
    const blob = await res.blob();
    await navigator.clipboard.write([
        new ClipboardItem({
            [blob.type]: blob
        })
    ]);
}

share_btn.onclick = async () => {
    try{
        const res = await fetch(img_el.src);
        const blob = await res.blob();
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
    }catch (e){
        console.error(e);
    }
    const url = `https://x.com/share?url=${location.href}&text=WordsMikuでリリックカードを作成しました！&hashtags=WordsMiku`
    window.open(encodeURI(url));
}

