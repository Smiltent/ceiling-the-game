
import { WIDTH, HEIGHT } from "./util/config"
import { addBounds } from "./util/bounds"
import kaplay from "kaplay"
import { createPlayer } from "./player/create"
import addDeathFrame from "./util/deathFrame"

const k = kaplay({
    width: WIDTH,
    height: HEIGHT,
    letterbox: true,
    stretch: true,
    background: [0, 0, 0],
    crisp: true
})

k.loadRoot("./") // itch.io publishing
k.loadSprite("ceiling", "sprites/ceiling.png")
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

createPlayer(k, {
    onDeath: () => {
        k.setCamScale(1)
        addDeathFrame(k, deathBars)
    }
})