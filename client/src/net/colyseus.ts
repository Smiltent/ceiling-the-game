
import { Client, Callbacks, type Room } from "@colyseus/sdk"

export type NetPlayer = {
    tintR: number
    tintG: number
    tintB: number
    tintAlpha: number

    x: number
    y: number
    angle: number
    facing: number

    dead: boolean
    hp: number
}

export type GameState = {
    players: Map<string, NetPlayer>
}

let room: Room<any, GameState> | null = null
export function getRoom() {
    return room
}

export async function joinGame() {
    const client = new Client("http://localhost:2567")
    room = await client.joinOrCreate<GameState>("my_room")

    return room
}

export function watchPlayers(gameRoom: Room<any, GameState>, handler: {
    onAdd: (player: NetPlayer, sessionId: string) => void
    onRemove: (player: NetPlayer, sessionId: string) => void
}) {
    const callbacks = Callbacks.get(gameRoom)

    callbacks.onAdd("players", (player, sessionId) => {
        handler.onAdd(player as NetPlayer, sessionId)
    })

    callbacks.onRemove("players", (player, sessionId) => {
        handler.onRemove(player as NetPlayer, sessionId)
    })
}