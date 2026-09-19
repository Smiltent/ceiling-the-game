
import { 
    FALLBACK_REST_ANGL, MAX_SPEED, WIDTH, MAX_UP_VEL, 
    FLIP_SPIN, FRICTION, ACCEL, AIR_ACCEL, WEIGHT_PULL, 
    ANG_DAMP, LEAN_RATE, FALL_LEAN, FALL_LEAN_RATE, 
    MOVE_LEAN 
} from "../util/config" // holy imports

import { createHands, updateHands } from "../util/player/hand"
import opaqueBtmWeight from "../util/opaqueBtmWeight"
import applyFace from "../util/player/applyFace"
import { isOutBounds } from "../util/bounds"
import opaqueHull from "../util/opaqueHull"
import tilt from "../util/player/tilt"
import { KAPLAYCtx } from "kaplay"
import die from "../util/player/die"

type PlayerInput = {
    left: boolean
    right: boolean
    up: boolean
}

export function createPlayer(
    k: KAPLAYCtx,
    options?: {
        pos?: { x: number; y: number }
        getInput?: () => PlayerInput
        onDeath?: () => void
    }
) {
    const getInput = options?.getInput ?? (() => ({
        left: k.isKeyDown("left"),
        right: k.isKeyDown("right"),
        up: k.isKeyDown("up")
    }))

    const state = {
        bottom: { mass: 0, comX: 0, comY: 0 },
        baseHull: [] as [number, number][],
        restAngle: FALLBACK_REST_ANGL,
        visLeft: 0,
        angVel: 0,

        facing: 1,
        appliedFace: 0,

        silLocal: [] as [number, number][],
        lean: 0,
        flipping: false,
        flipTravel: 0,

        hp: MAX_SPEED,
        dead: false,
    }

    const player = k.add([
        k.pos(options?.pos?.x ?? WIDTH / 2, options?.pos?.y ?? -50),
        k.anchor("center"),
        k.rotate(0),
        k.area({
            shape: new k.Rect(k.vec2(-64, -40), 128, 80)
        }),
        k.body(),
        "player"
    ])

        let camScale = 1
    let zoomT = 0
    let zooming = false

    const vis = player.add([
        k.sprite("ceiling"),
        k.anchor("center"),
        k.pos(0, 0),
        k.rotate(0)
    ])

    const { front, back, state: handState } = createHands(k, player, vis)

    function face() {
        applyFace(k, player, vis, state.facing, state)
    }

    k.onLoad(async () => {
        const src = "./sprites/ceiling/ceiling.png"
        const { hull, nat, restAngle: sit } = await opaqueHull(src)

        state.bottom = await opaqueBtmWeight(src)
        state.restAngle = sit === 0 ? FALLBACK_REST_ANGL : sit

        const halfW = vis.width / 2
        const halfH = vis.height / 2

        state.baseHull = hull.map(([x, y]) => [x - halfW, y - halfH])
        state.silLocal = nat.map(([x, y]) => [x - halfW, y - halfH])
        state.visLeft = tilt(state.silLocal, state.restAngle, state.visLeft)
        state.lean = 0
        state.appliedFace = 0

        face()
        player.angle = 0
    })

    k.onUpdate(() => {
        const dt = k.dt()

        if (state.dead) return
        if (state.hp <= 0) {
            die(k, player, state, options?.onDeath)
            return
        }

        if (isOutBounds(k, player.pos)) {
            die(k, player, state, options?.onDeath, { vanish: true})
            return
        }

        const input = getInput()
        let dir = 0

        if (input.left) dir -= 1
        if (input.right) dir += 1
        if (input.up && player.isGrounded() && !state.flipping) {
            const keepX = player.vel.x

            player.jump()
            player.vel.x = keepX
        }

        if (player.vel.y < -MAX_UP_VEL) {
            player.vel.y = -MAX_UP_VEL
        }

        // turnaround -> hop + spin
        if (!state.flipping && dir !== 0 && dir !== state.facing) {
            state.flipping = true
            state.facing = dir

            state.flipTravel = 0

            state.angVel = dir * FLIP_SPIN
        }

        if (state.flipping && dir !== 0 && dir !== state.facing) {
            state.facing = dir
            state.angVel = dir * FLIP_SPIN
            state.flipTravel = Math.max(0, 180 - state.flipTravel)
        }

        // horizontal
        {
            const want = dir !== 0 && dir === state.facing ? dir * MAX_SPEED : 0
            const rate = player.isGrounded() ? want === 0 ? FRICTION : ACCEL : AIR_ACCEL

            const vx = player.vel.x
            player.vel.x = vx + Math.sign(want - vx) * Math.min(Math.abs(want - vx), rate * dt)
        }

        // finish flip
        if (state.flipping) {
            const step = state.angVel * dt
            player.angle += step
            state.flipTravel += Math.abs(step)

            const rad = (player.angle * Math.PI) / 180
            const localX = state.bottom.comX * state.facing
            const comX = localX * Math.cos(rad) - state.bottom.comY * Math.sin(rad)

            state.angVel += -comX * WEIGHT_PULL * dt
            state.angVel *= Math.exp(-ANG_DAMP * 0.25 * dt)

            if (state.flipTravel >= 180) {
                state.flipping = false
                state.flipTravel = 0
                state.angVel = 0
                state.lean = 0

                player.angle = 0

                face()
            }
        } else {
            state.angVel = 0

            let leanTarg = 0
            let leanRate = LEAN_RATE
            if (!player.isGrounded()) {
                if (player.vel.y > 0) {
                    leanTarg = FALL_LEAN
                    leanRate = FALL_LEAN_RATE
                } else {
                    leanTarg = state.lean
                    leanRate = 0
                }
            } else if (dir !== 0 && dir === state.facing) {
                leanTarg = MOVE_LEAN
            }

            const t = Math.min(1, leanRate * dt)
            state.lean += (leanTarg - state.lean) * t

            player.angle = state.lean * state.facing
            face()
        } 

        updateHands(k, front, back, handState, player.angle, dt, state.facing, vis)
    })

    return { player, vis, state }
}