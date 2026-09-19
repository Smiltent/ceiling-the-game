
import { apply, VignetteOpt } from "../shaders/vignette"
import { CompList, KAPLAYCtx, Vec2 } from "kaplay"

export const AIR = 0
export const SOLID_YELLOW = 1
export const SOLID_GRAY = 2
export const BOX = 3

export const SNOWY_TOP_FG = 21
export const SNOWY_TOP = 22

export type BlockId = number
export type BlockDef = (k: KAPLAYCtx, size: number) => CompList<any>

export const blocks: Record<number, BlockDef> = {
    [SOLID_YELLOW]: (k, size) => [
        k.rect(size, size),
        k.color(k.Color.YELLOW),
        k.area(),
        k.body({ isStatic: true }),
        "platform"
    ],

    [SOLID_GRAY]: (k, size) => [
        k.rect(size, size),
        k.color(k.Color.fromHex("#1a1b1b")),
        k.area(),
        k.body({ isStatic: true }),
        "platform"
    ],

    [BOX]: (k, size) => [
        k.sprite("box"),
        k.area(),
        k.scale(size / 32),
        k.body({ mass: 4, gravityScale: 1.4, stickToPlatform: false }),
        k.rotate(0),
        "box"
    ],

    // snowy
    [SNOWY_TOP_FG]: (k, size) => [
        k.sprite("snowy-fg"),
        k.z(10),
        k.scale(size / 32)
    ],

    [SNOWY_TOP]: (k, size) => [
        k.sprite("snowy"),
        k.scale(size / 32),
        k.z(2),
        k.area(),
        k.body({ isStatic: true }),
        "platform"
    ]
}

export type SceneDef = {
    width: number
    map: BlockId[]
    tileSize: number
    pos?: Vec2
    vignette?: VignetteOpt
}

export function loadScene(k: KAPLAYCtx, scene: SceneDef) {
    const size = scene.tileSize ?? 64
    const ox = scene.pos?.x ?? 0
    const oy = scene.pos?.y ?? 0
    
    const cols = scene.width
    const rows = Math.ceil(scene.map.length / cols)

    for (let i = 0; i < scene.map.length; i++) {
        const id = scene.map[i]
        if (id === AIR) continue

        const def = blocks[id]
        if (!def) {
            console.warn(`tried loading a block (${id}) @ index ${i}`)
            continue
        }

        const col = i % cols
        const row = Math.floor(i / cols)

        k.add([
            k.pos(ox + col * size, oy + row * size),
            ...def(k, size)
        ])

        if (scene.vignette) {
            apply(k, scene.vignette)
        }
    }

    return { cols, rows, tileSize: size }
}