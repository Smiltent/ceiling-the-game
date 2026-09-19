
import { GameObj, KAPLAYCtx } from "kaplay"

export default function die(k: KAPLAYCtx, player: GameObj, state: { dead: boolean, hp: number }, onDeath?: () => void) {
    if (state.dead) return

    state.dead = true
    state.hp = 0

    player.vel = k.vec2(0, 0)

    const body = player as unknown as { gravityScale?: number }
    if (typeof body.gravityScale === "number") {
        body.gravityScale = 0
    }

    onDeath?.()
}