
import { KAPLAYCtx, Vec2 } from "kaplay"
import { BORDER_GRACE } from "./config"

export function isOutBounds(k: KAPLAYCtx, pos: Vec2) {
    const g = BORDER_GRACE

    return (
        pos.x < -g ||
        pos.y < -g ||
        pos.x > k.width() + g ||
        pos.y > k.height() + g
    )
}