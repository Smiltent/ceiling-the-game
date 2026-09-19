
import { CompList, KAPLAYCtx, Vec2 } from "kaplay"

export const AIR = 0
export const SOLID = 1

export type BlockId = number
export type BlockDef = (k: KAPLAYCtx, size: number) => CompList<any>

export const blocks: Record<number, BlockDef> = {
    [SOLID]: (k, size) => [
        k.rect(size, size),
        k.color(k.Color.YELLOW),
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
    }

    return { cols, rows, tileSize: size }
}