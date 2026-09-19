
import { KAPLAYCtx, Vec2 } from "kaplay"
import { BORDER_GRACE } from "./config"

export function addBounds(k: KAPLAYCtx) {
    const w = k.width()
    const h = k.height()

    const t = 4
    const edge = (x: number, y: number, ww: number, hh: number) =>
    k.add([
        k.rect(ww, hh),
        k.pos(x, y),
        k.color(k.Color.BLACK),
        k.opacity(1),
        "border"
    ])

    edge(0, 0, w, t)
    edge(0, h - t, w, t)
    edge(0, 0, t, h),
    edge(w - t, 0, t, h)
}

export function isOutBounds(k: KAPLAYCtx, pos: Vec2) {
    const g = BORDER_GRACE

    return (
        pos.x < -g ||
        pos.y < -g ||
        pos.x > k.width() + g ||
        pos.y > k.height() + g
    )
}