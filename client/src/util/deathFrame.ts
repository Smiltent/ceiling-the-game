
import { WIDTH, HEIGHT } from "./config"
import { KAPLAYCtx } from "kaplay"

export default function addDeathFrame(k: KAPLAYCtx, bars: ReturnType<typeof k.add>[]) {
    bars.length = 0
    const w = WIDTH
    const h = HEIGHT

    const bar = (x: number, y: number, ww: number, hh: number) => {
        const b = k.add([
            k.rect(ww, hh),
            k.pos(x, y),
            k.color(k.Color.BLACK),
            k.fixed(),
            k.z(1000),
            "deathFrame"
        ])

        bars.push(b)
        return b
    }

    bar(0, 0, w, 0)
    bar(0, h, w, 0)
    bar(0, 0, 0, h)
    bar(w, 0, 0, h)
}