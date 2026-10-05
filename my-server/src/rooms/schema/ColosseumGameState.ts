// my-server/src/rooms/schema/ColosseumGameState.ts
import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class GamePlayer extends Schema {
  @type("string") id: string;
  @type("string") name: string;
  @type("number") score: number = 0;
  @type("number") kills: number = 0;
  @type("number") deaths: number = 0;
  @type("number") x: number = 400;
  @type("number") y: number = 300;
  @type("number") health: number = 100;
  @type("string") team: string = "red"; // 'red' | 'blue'
  @type("boolean") isAlive: boolean = true;
  @type("string") currentWeapon: string = "sword";
  @type("number") respawnTimer: number = 0;
}

export class PowerUp extends Schema {
  @type("string") id: string;
  @type("string") type: string; // 'health' | 'speed' | 'damage' | 'shield'
  @type("number") x: number;
  @type("number") y: number;
  @type("boolean") active: boolean = true;
}

export class Projectile extends Schema {
  @type("string") id: string;
  @type("string") ownerId: string;
  @type("number") x: number;
  @type("number") y: number;
  @type("number") velocityX: number;
  @type("number") velocityY: number;
  @type("number") damage: number = 10;
  @type("string") type: string = "arrow";
}

export class GameEvent extends Schema {
  @type("string") id: string;
  @type("string") type: string; // 'kill' | 'powerup_collect' | 'team_wipe' | 'double_kill'
  @type("string") playerId: string;
  @type("string") targetId: string;
  @type("string") message: string;
  @type("number") timestamp: number;
}

export class ColosseumGameState extends Schema {
  @type({ map: GamePlayer }) players = new MapSchema<GamePlayer>();
  @type({ map: PowerUp }) powerUps = new MapSchema<PowerUp>();
  @type([Projectile]) projectiles = new ArraySchema<Projectile>();
  @type([GameEvent]) events = new ArraySchema<GameEvent>();
  
  @type("string") gameStatus: string = "waiting"; // 'waiting' | 'countdown' | 'playing' | 'finished'
  @type("number") gameTime: number = 300; // 5 minutes
  @type("number") matchTime: number = 0;
  @type("number") redScore: number = 0;
  @type("number") blueScore: number = 0;
  @type("number") maxPlayers: number = 8;
  @type("number") minPlayers: number = 2;
  @type("number") countdownTime: number = 5;
  
  // Arena configuration
  @type("number") arenaWidth: number = 800;
  @type("number") arenaHeight: number = 600;
}