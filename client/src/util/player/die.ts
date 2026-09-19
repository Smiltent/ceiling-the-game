
import { GameObj, KAPLAYCtx } from "kaplay"

export default function die(k: KAPLAYCtx, player: GameObj, state: { dead: boolean, hp: number }, onDeath?: () => void, options?: { vanish?: boolean }) {
    if (state.dead) return

    state.dead = true
    state.hp = 0

    player.vel = k.vec2(0, 0)

    const body = player as unknown as { gravityScale?: number }
    if (typeof body.gravityScale === "number") {
        body.gravityScale = 0
    }

    if (options?.vanish) {
        player.hidden = true

        if (player.has("area")) player.unuse("area")
        if (player.has("body")) player.unuse("body")
    }

    onDeath?.()
}