
import { HAND_SWING_DAMP, HAND_SWING_DRIVE, HAND_SWING_STIFF, HAND_TACK_X, HAND_TACK_Y } from "../config"
import { GameObj, KAPLAYCtx } from "kaplay"

export type HandState = {
    angle: number
    angVel: number
    prevBodyAngle: number
}

function create(k: KAPLAYCtx, parent: GameObj, sprite: string, z: number) {
    return parent.add([
        k.sprite(sprite),
        k.anchor("top"),
        k.pos(HAND_TACK_X, HAND_TACK_Y),
        k.rotate(0),
        k.z(z),
        "hand"
    ])
}

export function createHands(k: KAPLAYCtx, body: GameObj, vis: GameObj) {
    vis.z = 0

    const front = create(k, body, "ceiling-hand-1", 1)
    const back = create(k, body, "ceiling-hand-2", -1)

    return {
        front, back,
        state: {
            angle: 0,
            angVel: 0,
            prevBodyAngle: 0
        }
    }
}

function placeHand(k: KAPLAYCtx, hand: GameObj, vis: GameObj, facing: number, swing: number) {
    const localX = HAND_TACK_X * facing
    const localY = HAND_TACK_Y

    const rad = (vis.angle * Math.PI) / 180
    const rx = localX * Math.cos(rad) - localY * Math.sin(rad)
    const ry = localX * Math.sin(rad) + localY * Math.cos(rad)

    hand.pos = vis.pos.add(k.vec2(rx, ry))
    hand.angle = vis.angle + swing * facing
    hand.flipX = facing === -1
}

// swing swing like on a tack
export function updateHands(k: KAPLAYCtx, front: GameObj, back: GameObj, hs: HandState, bodyAngle: number, dt: number, facing: number, vis: GameObj) {
    const bodyDelta = bodyAngle - hs.prevBodyAngle
    hs.prevBodyAngle = bodyAngle

    hs.angVel -= bodyDelta * HAND_SWING_DRIVE / Math.max(dt, 1 / 120)
    hs.angVel += -hs.angle * HAND_SWING_STIFF * dt
    hs.angVel *= Math.exp(-HAND_SWING_DAMP * dt)
    
    hs.angle += hs.angVel * dt
    hs.angle = Math.max(-70, Math.min(70, hs.angle))

    placeHand(k, front, vis, facing, hs.angle)
    placeHand(k, back, vis, facing, hs.angle)
}