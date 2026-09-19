import { WIDTH, HEIGHT, DEAD_CAM_SCALE, DEAD_CAM_TIME } from "./util/config"
import { joinGame, NetPlayer, watchPlayers } from "./net/colyseus"
import { loadVig } from "./util/shaders/vignette"
import { createPlayer } from "./player/create"
import addDeathFrame from "./util/deathFrame"
import { loadLobby } from "./scenes/lobby"
import { Callbacks } from "@colyseus/sdk"
import kaplay from "kaplay"
import die from "./util/player/die"

const INTERP = 18

const k = kaplay({
    width: WIDTH,
    height: HEIGHT,
    letterbox: true,
    stretch: true,
    background: [0, 0, 0],
    crisp: true
})

k.loadRoot("./")

loadVig(k)

k.loadSprite("ceiling", "sprites/ceiling/ceiling.png")
k.loadSprite("ceiling-hand-1", "sprites/ceiling/hand/1.png")
k.loadSprite("ceiling-hand-2", "sprites/ceiling/hand/2.png")

k.loadSprite("box", "sprites/tiles/box.png")

k.loadSprite("snowy", "sprites/tiles/snowy/snowy.png")
k.loadSprite("snowy-fg", "sprites/tiles/snowy/snowy-fg.png")

k.setGravity(850)

k.add([
    k.rect(WIDTH, HEIGHT),
    k.pos(0, 0),
    k.color(100, 100, 100),
    k.z(-100),
    "playfield"
])

loadLobby(k)
const deathBars: ReturnType<typeof k.add>[] = []

let camScale = 1
let zoomT = 0
let zooming = false

function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3)
}

function triggerLocalDeathFx() {
    zooming = true
    zoomT = 0
    camScale = 1
    k.setCamScale(1)
    addDeathFrame(k, deathBars)
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

type Puppet = {
    player: ReturnType<typeof createPlayer>["player"]
    state: ReturnType<typeof createPlayer>["state"]
    applyTint: ReturnType<typeof createPlayer>["applyTint"]
    face: ReturnType<typeof createPlayer>["face"]
    target: {
        x: number
        y: number
        angle: number
    }
    destroy: () => void
}

const remotes = new Map<string, Puppet>()
const local = createPlayer(k, {
    onDeath: triggerLocalDeathFx
})

function spawnRemote(net: NetPlayer) {
    const remote = createPlayer(k, {
        remote: true,
        pos: { x: net.x, y: net.y },
        getInput: () => ({ left: false, right: false, up: false })
    })

    remote.applyTint(k.rgb(net.tintR, net.tintG, net.tintB))
    remote.state.facing = net.facing < 0 ? -1 : 1
    remote.player.angle = net.angle
    remote.face()

    return {
        player: remote.player,
        state: remote.state,
        applyTint: remote.applyTint,
        face: remote.face,
        target: { x: net.x, y: net.y, angle: net.angle },
        destroy: () => remote.player.destroy()
    } satisfies Puppet
}

k.onUpdate(() => {
    const dt = k.dt()
    const t = Math.min(1, INTERP * dt)
    for (const r of remotes.values()) {
        if (r.state.dead) continue
        r.player.pos.x += (r.target.x - r.player.pos.x) * t
        r.player.pos.y += (r.target.y - r.player.pos.y) * t
        r.player.angle += (r.target.angle - r.player.angle) * t
    }
})

joinGame()
    .then((room) => {
        watchPlayers(room, {
            onAdd: (net, sessionId) => {
                const callbacks = Callbacks.get(room)
                const tint = k.rgb(net.tintR, net.tintG, net.tintB)

                if (sessionId === room.sessionId) {
                    local.applyTint(tint)

                    callbacks.listen(net, "dead", (dead) => {
                        if (!dead || local.state.dead) return
                        die(k, local.player, local.state, triggerLocalDeathFx, { vanish: true })
                    })
                    return
                }

                const puppet = spawnRemote(net)
                remotes.set(sessionId, puppet)

                callbacks.listen(net, "x", (x) => {
                    const r = remotes.get(sessionId)
                    if (r) r.target.x = x
                })
                callbacks.listen(net, "y", (y) => {
                    const r = remotes.get(sessionId)
                    if (r) r.target.y = y
                })
                callbacks.listen(net, "angle", (angle) => {
                    const r = remotes.get(sessionId)
                    if (r) r.target.angle = angle
                })
                callbacks.listen(net, "facing", (facing) => {
                    const r = remotes.get(sessionId)
                    if (!r) return
                    r.state.facing = facing < 0 ? -1 : 1
                    r.face()
                })
                callbacks.listen(net, "dead", (dead) => {
                    const r = remotes.get(sessionId)
                    if (!r || !dead || r.state.dead) return
                    die(k, r.player, r.state, undefined, { vanish: true })
                })
            },
            onRemove: (_net, sessionId) => {
                remotes.get(sessionId)?.destroy()
                remotes.delete(sessionId)
            }
        })

        k.onUpdate(() => {
            if (local.state.dead) return
            room.send("move", {
                x: local.player.pos.x,
                y: local.player.pos.y,
                angle: local.player.angle,
                facing: local.state.facing
            })
        })
    })
    .catch((err) => {
        console.error("failed to join", err)
    })
