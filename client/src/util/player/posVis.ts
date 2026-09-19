
import { GameObj, KAPLAYCtx } from "kaplay"
import tilt from "./tilt"

export default function posVis(k: KAPLAYCtx, vis: GameObj, face: number, restAngle: number, lean: number, silLocal: [number, number][], visLeft: number) {
    vis.flipX = face === -1
    vis.angle = restAngle * face
    vis.pos = k.vec2(0, tilt(silLocal, restAngle, visLeft))
}