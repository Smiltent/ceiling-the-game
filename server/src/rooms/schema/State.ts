
import { schema, t, type SchemaType } from "@colyseus/schema"

export const Player = schema({
    tintR: t.uint8().default(255),
    tintG: t.uint8().default(255),
    tintB: t.uint8().default(255),
    tintAlpha: t.number().default(0.18),

    x: t.number().default(960),
    y: t.number().default(-50),
    angle: t.number().default(0),
    facing: t.int8().default(1),

    dead: t.boolean().default(false),
    hp: t.uint8().default(100)
}, "Player")
export type Player = SchemaType<typeof Player>

export const MyRoomState = schema({
    players: t.map(Player),
}, "Room")
export type MyRoomState = SchemaType<typeof MyRoomState>
