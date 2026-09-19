
import { createPlayer } from "./player/create"
import { WIDTH, HEIGHT, DEAD_CAM_SCALE, DEAD_CAM_TIME } from "./util/config"
import addDeathFrame from "./util/deathFrame"
import { addBounds } from "./util/bounds"
import kaplay from "kaplay"

const k = kaplay({
    width: WIDTH,
    height: HEIGHT,
    letterbox: true,
    stretch: true,
    background: [0, 0, 0],
    crisp: true
})

k.loadRoot("./") // itch.io publishing

k.loadSprite("ceiling", "sprites/ceiling/ceiling.png")
k.loadSprite("ceiling-hand-1", "sprites/ceiling/hand/1.png")
k.loadSprite("ceiling-hand-2", "sprites/ceiling/hand/2.png")

k.setGravity(850)

k.add([
    k.rect(WIDTH, HEIGHT),
    k.pos(0, 0),
    k.color(100, 100, 100),
    k.z(-100),
    "playfield"
])

k.add([
    k.rect(k.width(), 48),
    k.pos(0, k.height() - 48),
    k.color(k.Color.BLACK),
    k.area(),
    k.body({ isStatic: true }),
    "platform"
])

const deathBars: ReturnType<typeof k.add>[] = []
addBounds(k)


let camScale = 1
let zoomT = 0
let zooming = false

function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3)
}

k.onUpdate(() => {
    if (!zooming) return
    const dt = k.dt()

    zoomT = Math.min(1, zoomT + dt / DEAD_CAM_TIME)
    const t = easeOutCubic(zoomT)

    camScale = 1 + (DEAD_CAM_SCALE - 1) * t

    k.setCamScale(camScale)
    if (zoomT >= 1) zooming = false
})

createPlayer(k, {
    onDeath: () => {
        zooming = true
        zoomT = 0
        camScale = 1

        k.setCamScale(1)
        addDeathFrame(k, deathBars)
    }
})