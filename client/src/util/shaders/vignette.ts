
import { KAPLAYCtx } from "kaplay"

const FRAG = `
    uniform float u_strength;
    uniform float u_radius;

    vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
        vec4 c = def_frag();
        float d = length(uv - vec2(0.5));
        float vig = smoothstep(u_radius, u_radius - 0.5, d);
        c.rgb *= mix(1.0 - u_strength, 1.0, vig);
        return c;
    }
`

export type VignetteOpt = {
    strength?: number
    radius?: number
}

export function loadVig(k: KAPLAYCtx) {
    k.loadShader("vignette", null, FRAG)
}

export function apply(k: KAPLAYCtx, opt: VignetteOpt = { strength: 0.45, radius: 0.85 }) {
    k.usePostEffect("vignette", () => ({
        u_strength: opt.strength,
        u_radius: opt.radius
    }))
}