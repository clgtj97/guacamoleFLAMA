// my-server/src/index.ts
import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import { monitor } from "@colyseus/monitor";
import { playground } from "@colyseus/playground";
import { FerrariMetaverseRoom } from "./rooms/FerrariMetaverseRoom";
import { ColosseumGameRoom } from "./rooms/ColosseumGameRoom";
import { ChatRoom } from "./rooms/ChatRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

// Create Colyseus Server
const gameServer = new Server({
  server: createServer(app)
});

// Register Ferrari Metaverse Room
gameServer.define("ferrari_metaverse", FerrariMetaverseRoom);
gameServer.define("chat_room", ChatRoom);

gameServer.define("colosseum_game", ColosseumGameRoom)
  .filterBy(["maxPlayers"]);

// Register more room types for different areas
gameServer.define("ferrari_showroom", FerrariMetaverseRoom);
gameServer.define("ferrari_lounge", FerrariMetaverseRoom);
gameServer.define("ferrari_track", FerrariMetaverseRoom);

// Register colyseus monitor
app.use("/colyseus", monitor());

if (process.env.NODE_ENV !== "production") {
  app.use("/playground", playground());
}

// Add a simple status endpoint
app.get("/status", (req, res) => {
  res.json({
    status: "online",
    server: "Ferrari Metaverse",
    version: "1.0.0",
    uptime: process.uptime()
  });
});

gameServer.listen(port);
console.log(`🚀 Ferrari Metaverse server listening on ws://localhost:${port}`);
console.log(`📊 Monitor: http://localhost:${port}/colyseus`);
console.log(`🧪 Playground: http://localhost:${port}/playground`);