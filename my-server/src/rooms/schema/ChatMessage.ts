// my-server/src/rooms/schema/ChatMessage.ts
import { Schema, type } from "@colyseus/schema";

export class ChatMessage extends Schema {
  @type("string") id: string;
  @type("string") playerId: string;
  @type("string") playerName: string;
  @type("string") content: string;
  @type("number") timestamp: number;
  @type("string") type: "text" | "voice" = "text";
}