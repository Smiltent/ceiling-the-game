
import { FALLBACK_REST_ANGL, MAX_UP_VEL, FLIP_SPIN, MAX_SPEED, FRICTION, ACCEL, AIR_ACCEL, WEIGHT_PULL, ANG_DAMP, LEAN_RATE, FALL_LEAN, FALL_LEAN_RATE, MOVE_LEAN } from "./util/config"
import opaqueBtmWeight from "./util/opaqueBtmWeight"
import opaqueHull from "./util/opaqueHull"
import kaplay from "kaplay"

const k = kaplay({
    width: 1920,
    height: 1080,
    letterbox: true,
    stretch: true,
    background: [100, 100, 100],
    crisp: true
})

k.loadRoot("./") // itch.io publishing

k.loadSprite("ceiling", "sprites/ceiling.png")
k.setGravity(850)

let bottom = { mass: 0, comX: 0, comY: 0 }
let baseHull: [number, number][] = []
let restAngle = FALLBACK_REST_ANGL
let visLeft = 0 
let angVel = 0
let facing = 1

let silLocal: [number, number][] = []
let lean = 0

let flipping = false
let flipTravel = 0

const player = k.add([
    k.pos(1280 / 2, -120),
    k.anchor("center"),
    k.rotate(0),
    k.area({
        shape: new k.Rect(k.vec2(-64, -40), 128, 80)
    }),
    k.body(),
    "player"
])

const vis = player.add([
    k.sprite("ceiling"),
    k.anchor("center"),
    k.pos(0, 0),
    k.rotate(0)
])

k.add([
    k.rect(k.width(), 48),
    k.pos(0, k.height() - 48),
    k.color(k.Color.BLACK),
    k.area(),
    k.body({ isStatic: true }),
    "platform"
])

function tilt(deg: number) {
    if (silLocal.length === 0) return visLeft

    let unrotMaxY = -Infinity
    let rotMaxY = -Infinity
    for (const [lx, ly] of silLocal) {
        if (ly > unrotMaxY) unrotMaxY = ly

        const r = (restAngle * Math.PI) / 180
        const ry = lx * Math.sin(r) + ly * Math.cos(r)
        if (ry > rotMaxY) rotMaxY = ry
    }
    return unrotMaxY - rotMaxY
}

function posVis(face: number) {
    vis.flipX = face === -1
    vis.angle = restAngle * face
    vis.pos = k.vec2(0, tilt(restAngle + lean))
}

let appliedFace = 0
function applyFace(face: number) {
    posVis(face)

    if (baseHull.length < 3) return
    if (face === appliedFace) return
    appliedFace = face

    const pts = baseHull.map(([x, y]) => k.vec2(x * face, y))
    if (face === -1) pts.reverse()
    player.area.shape = new k.Polygon(pts)
}

k.onLoad(async () => {
    const src = "./sprites/ceiling.png"
    const { hull, nat, restAngle: sit } = await opaqueHull(src)
    bottom = await opaqueBtmWeight(src)

    restAngle = sit === 0 ? FALLBACK_REST_ANGL : sit

    const halfW = vis.width / 2
    const halfH = vis.height / 2

    baseHull = hull.map(([x, y]) => [x - halfW, y - halfH])
    silLocal = nat.map(([x, y]) => [x - halfW, y - halfH])
    visLeft = tilt(restAngle)
    lean = 0

    appliedFace = 0
    applyFace(facing)
    player.angle = 0
})

k.onUpdate(() => {
    const dt = k.dt()
    let dir = 0

    if (k.isKeyDown("left")) dir -= 1
    if (k.isKeyDown("right")) dir += 1
    if (k.isKeyDown("up") && player.isGrounded() && !flipping) {
        const keepX = player.vel.x

        player.jump()
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

            lean = 0
            player.angle = 0
            applyFace(facing)
        }
    } else {
        angVel = 0

        let leanTarg = 0
        let leanRate = LEAN_RATE
        if (!player.isGrounded()) {
            if (player.vel.y > 0) {
                leanTarg = FALL_LEAN
                leanRate = FALL_LEAN_RATE
            } else {
                leanTarg = lean
                leanRate = 0
            }
        } else if (dir !== 0 && dir === facing) {
            leanTarg = MOVE_LEAN
        }

        const t = Math.min(1, leanRate * dt)
        lean += (leanTarg - lean) * t

        player.angle = lean * facing
        applyFace(facing)
    } 
})