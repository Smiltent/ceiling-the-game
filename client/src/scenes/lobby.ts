
import { AIR as _, SOLID_YELLOW as a, loadScene, SceneDef } from "../util/scenes/blocks"
import { HEIGHT, WIDTH } from "../util/config"
import { KAPLAYCtx } from "kaplay"

const TILE = 64
const COLS = Math.floor(WIDTH / TILE)
const ROWS = Math.floor(HEIGHT / TILE)
const DOOR_H = 3

function box(cols: number, rows: number) {
    const map = []

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const floor = row === rows - 1
            const wall = col === 0 || col === cols - 1
            const door =
                col === cols - 1 &&
                row >= rows - 1 - DOOR_H &&
                row < rows - 1

            if (door) {
                map.push(_)
            } else {
                map.push(floor || wall ? a : _)
            }
        }
    }

    return map
}

const lobbyMap: SceneDef = {
    width: COLS,
    tileSize: TILE,
    pos: { x: 0, y: HEIGHT - ROWS * TILE } as any,
    map: box(COLS, ROWS)
}

export function loadLobby(k: KAPLAYCtx) {
    loadScene(k, lobbyMap)
}