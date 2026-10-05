// my-server/src/rooms/schema/FerrariRoomState.ts
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import { FerrariPlayer } from "./FerrariPlayer";
import { ChatMessage } from "./ChatMessage";

export { FerrariPlayer } from "./FerrariPlayer";
export { ChatMessage } from "./ChatMessage";

export class FerrariRoomState extends Schema {
  @type({ map: FerrariPlayer }) players = new MapSchema<FerrariPlayer>();
  @type([ChatMessage]) chatMessages = new ArraySchema<ChatMessage>();
  @type("string") roomId: string = "ferrari_showroom";
  @type("string") roomName: string = "🏎️ Ferrari Metaverse";
}