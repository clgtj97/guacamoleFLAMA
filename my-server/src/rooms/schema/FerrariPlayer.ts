// my-server/src/rooms/schema/FerrariPlayer.ts
import { Schema, type } from "@colyseus/schema";

export class FerrariPlayer extends Schema {
  @type("string") id: string;
  @type("string") sessionId: string;
  @type("string") name: string;
  @type("number") x: number = 400;
  @type("number") y: number = 0;
  @type("string") direction: string = "right";
  @type("string") currentAnimation: string = "idle";
  @type("string") roomId: string = "outside";
  @type("boolean") isClubMember: boolean = false;
}