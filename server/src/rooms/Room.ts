
import { MyRoomState, Player } from "./schema/State.js"
import { Room, Client, CloseCode } from "colyseus"

const WIDTH = 1920
const HEIGHT = 1080
const BORDER_GRACE = 150

function isOutBounds(x: number, y: number) {
	return x < -BORDER_GRACE || y < -BORDER_GRACE || x > WIDTH + BORDER_GRACE || y > HEIGHT + BORDER_GRACE
}

function randomTint() {
	const hue = Math.random() * 360
	const sat = 0.25 + Math.random() * 0.2
	const light = 0.72 + Math.random() * 0.15

	const c = (1 - Math.abs(2 * light - 1)) * sat
	const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
	const m = light - c / 2

	let r = 0
	let g = 0
	let b = 0

	if (hue < 60) {
		[r, g, b] = [c, x, 0]
	} else if (hue < 120) {
		[r, g, b] = [x, c, 0]
	} else if (hue < 180) {
		[r, g, b] = [0, c, x]
	} else if (hue < 240) {
		[r, g, b] = [0, x, c]
	} else if (hue < 300) {
		[r, g, b] = [x, 0, c]
	} else {
		[r, g, b] = [c, 0, x]
	}

	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255),
	}
}

export class MyRoom extends Room<{ state: MyRoomState }> {
    maxClients = 4
    state = new MyRoomState()

    messages = {
		move: (client: Client, message: { x: number; y: number; angle: number; facing: number}) => {
			const p = this.state.players.get(client.sessionId)
			if (!p || p.dead) return

			p.x = message.x
			p.y = message.y
			p.angle = message.angle
			p.facing = message.facing < 0 ? -1 : 1

			if (isOutBounds(p.x, p.y)) {
				p.dead = true
				p.hp = 0
			}
		}
    };

    onCreate(_options: any) {}

    onJoin(client: Client, options: any) {
		const tint = randomTint()

		this.state.players.set(
			client.sessionId,
			new Player({
				tintR: tint.r,
				tintG: tint.g,
				tintB: tint.b,
				tintAlpha: 0.18,
				x: 960,
				y: -50,
				angle: 0,
				facing: 1
			})
		)

		console.log(client.sessionId, "joined!", tint)
    }

    onLeave(client: Client, code: CloseCode) {
		this.state.players.delete(client.sessionId)
		console.log(client.sessionId, "left!", code)
    }

    onDispose() {
		console.log("room", this.roomId, "disposing...")
    }
}
