
import kaplay from "kaplay"
import opaqueHull from "./util/opaqueHull"
import opaqueBtmWeight from "./util/opaqueBtmWeight"

const k = kaplay()
k.loadRoot("./") // itch.io publishing

k.loadSprite("ceiling", "sprites/ceiling.png")
k.setGravity(1000)




// CONFIG
const MAX_SPEED = 420
const ACCEL = 1600
const FRICTION = 1400
const AIR_ACCEL = 1400
const FLIP_SPIN = 780
const JUMP_FORCE = 1000
const MAX_UP_VEL = 650
const WEIGHT_PULL = 28
const ANG_DAMP = 10

let bottom = { mass: 0, comX: 0, comY: 0 }
let baseHull: [number, number][] = []
let angVel = 0
let facing = 1

let flipping = false
let flipTravel = 0

const player = k.add([
    k.sprite("ceiling"),
    k.pos(120, 80),
    k.anchor("center"),
    k.rotate(0),
    k.area(),
    k.body(),
    "player"
])

k.add([
    k.rect(k.width(), 48),
    k.pos(0, k.height() - 48),
    k.color(k.Color.BLACK),
    k.area(),
    k.body({ isStatic: true }),
    "platform"
])

let appliedFace = 0
function applyFace(face: number) {
    player.flipX = face === -1

    if (baseHull.length < 3) return
    if (face === appliedFace) return
    appliedFace = face

    const pts = baseHull.map(([x, y]) => k.vec2(x * face, y))
    if (face === -1) pts.reverse()
    player.area.shape = new k.Polygon(pts)
}

k.onLoad(async () => {
    const src = "./sprites/ceiling.png"
    const hull = await opaqueHull(src)
    bottom = await opaqueBtmWeight(src)

    const halfW = player.width / 2
    const halfH = player.height / 2

    baseHull = hull.map(([x, y]) => [x - halfW, y - halfH])

    appliedFace = 0
    applyFace(facing)
})





k.onUpdate(() => {
    const dt = k.dt()
    let dir = 0

    if (k.isKeyDown("left")) dir -= 1
    if (k.isKeyDown("right")) dir += 1
    if (k.isKeyDown("up") && player.isGrounded() && !flipping) {
        const keepX = player.vel.x

        player.jump(JUMP_FORCE)
        player.vel.x = keepX
    }

    if (player.vel.y < -MAX_UP_VEL) {
        player.vel.y = -MAX_UP_VEL
    }

    // turnaround -> hop + spin
    if (!flipping && dir !== 0 && dir !== facing) {
        flipping = true
        facing = dir

        flipTravel = 0

        angVel = dir * FLIP_SPIN
    }

    if (flipping && dir !== 0 && dir !== facing) {
        facing = dir
        angVel = dir * FLIP_SPIN
        flipTravel = Math.max(0, 180 - flipTravel)
    }

    // horizontal
    // if (!flipping) {
    {
        const want = dir !== 0 && dir === facing ? dir * MAX_SPEED : 0
        const rate = player.isGrounded() ? want === 0 ? FRICTION : ACCEL : AIR_ACCEL

        const vx = player.vel.x
        player.vel.x = vx + Math.sign(want - vx) * Math.min(Math.abs(want - vx), rate * dt)
    }

    // finish flip
    if (flipping) {
        const step = angVel * dt
        player.angle += step
        flipTravel += Math.abs(step)

        const rad = (player.angle * Math.PI) / 180
        const localX = bottom.comX * facing
        const comX = localX * Math.cos(rad) - bottom.comY * Math.sin(rad)
        angVel += -comX * WEIGHT_PULL * dt
        angVel *= Math.exp(-ANG_DAMP * 0.25 * dt)

        if (flipTravel >= 180) {
            flipping = false
            flipTravel = 0
            angVel = 0

            player.angle = 0
            // player.flipX = facing === -1
            applyFace(facing)
        }
    } else {
        // const leanTarg = dir !== 0 && dir === facing ? Math.max(-MAX_TILT, Math.min(MAX_TILT, dir * MOVE_LEAN)) : 0
        // const t = Math.min(1, LEAN_RATE * dt)

        // player.angle += (leanTarg - player.angle) * t
        // angVel = 0
        // applyFace(facing)

        player.angle = 0
        angVel = 0
        applyFace(facing)
    } 
})