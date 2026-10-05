import { Client, Room } from "colyseus.js";
import { cli, Options } from "@colyseus/loadtest";

export async function main(options: Options) {
    const client = new Client(options.endpoint);
    const roomName = options.roomName || "ferrari_metaverse";
    const user = `loadtest_${Math.random().toString(36).slice(2, 7)}`;

    const room: Room = await client.joinOrCreate(roomName, {
        name: user,
        isClubMember: false,
    });

    console.log(`joined ${roomName} successfully as ${user}`);

    room.onMessage("new_chat_message", (payload) => {
        console.log("chat>", payload.playerName, payload.content);
    });

    room.onStateChange((state: any) => {
        const playerCount = state?.players ? Object.keys(state.players).length : 0;
        console.log("state change: players", playerCount);
    });

    room.onLeave(() => {
        console.log("left");
    });

    // Send movement updates every 300ms
    let x = 400;
    let direction: "left" | "right" = "right";

    setInterval(() => {
        if (direction === "right") {
            x += 10;
            if (x >= 900) direction = "left";
        } else {
            x -= 10;
            if (x <= 300) direction = "right";
        }

        room.send("player_move", {
            x,
            y: 0,
            direction,
            animation: "walk",
            roomId: "outside",
        });
    }, 300);

    // Send a chat line every 8 seconds
    setInterval(() => {
        room.send("chat_message", {
            content: `hey from ${user} @ ${new Date().toLocaleTimeString()}`,
            type: "text",
        });
    }, 8000);
}

cli(main);
