# Colyseus Server Setup (Walk + Chat MVP)

This server already includes a multiplayer room that supports:

- player join/leave
- player movement sync (`player_move`)
- chat sync (`chat_message`)

Room name: `ferrari_metaverse`

## 1) Install dependencies

From this folder:

`my-server`

run:

- `npm install`

## 2) Start the server

- `npm start`

Server endpoints:

- WebSocket: `ws://localhost:2567`
- Monitor: `http://localhost:2567/colyseus`
- Playground: `http://localhost:2567/playground`
- Health check: `http://localhost:2567/status`

## 3) Quick multiplayer smoke test (2+ simulated users)

In another terminal:

- `npm run loadtest`

This joins `ferrari_metaverse` with 2 clients and continuously sends:

- movement updates
- chat messages

## 4) Front-end room contract (MVP)

Join options:

- `name: string`
- `isClubMember?: boolean`

Outgoing messages from client:

- `player_move` → `{ x, y, direction, animation, roomId }`
- `chat_message` → `{ content, type }`
- `player_action` → `{ action }`

Incoming messages from server:

- `room_state`
- `new_chat_message`
- `player_joined`
- `player_left`
- `player_acted`

## 5) Next step after MVP

Once this is stable, add minigames as separate room types and move players between rooms using room IDs + matchmaking.
