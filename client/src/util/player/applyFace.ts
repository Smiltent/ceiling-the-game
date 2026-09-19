
import { GameObj, KAPLAYCtx } from "kaplay"
import posVis from "./posVis"

export default function applyFace(k: KAPLAYCtx, player: GameObj, vis: GameObj, face: number, state: {
    appliedFace: number
    baseHull: [number, number][]
    restAngle: number
    lean: number
    silLocal: [number, number][]
    visLeft: number
}) {
    posVis(k, vis, face, state.restAngle, state.lean, state.silLocal, state.visLeft)

    if (state.baseHull.length < 3) return
    if (face === state.appliedFace) return
    state.appliedFace = face

    const pts = state.baseHull.map(([x, y]) => k.vec2(x * face, y))
    if (face === -1) pts.reverse()
        
    player.area.shape = new k.Polygon(pts)
}