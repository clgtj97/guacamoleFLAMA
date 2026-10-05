// my-server/src/rooms/ColosseumGameRoom.ts
import { Room, Client } from "colyseus";
import { ColosseumGameState, GamePlayer, PowerUp, Projectile, GameEvent } from "./schema/ColosseumGameState";

const ARENA_WIDTH = 800;
const ARENA_HEIGHT = 600;
const GAME_DURATION = 300; // 5 minutes
const RESPAWN_TIME = 5; // seconds
const POWERUP_SPAWN_INTERVAL = 10; // seconds

export class ColosseumGameRoom extends Room<ColosseumGameState> {
private gameLoop!: ReturnType<typeof setInterval>;
private powerUpLoop!: ReturnType<typeof setInterval>;
  
  onCreate(options: any) {
    console.log("🏟️ Colosseum Game Room created!", options);
    this.setState(new ColosseumGameState());
    
    // Set room type for matchmaking
    this.setMetadata({
      gameType: "colosseum",
      maxPlayers: 8,
      minPlayers: 2
    });
    
    // Setup all message handlers
    this.setupMessageHandlers();
    
    // Start game loop
    this.startGameLoop();
  }
  
  setupMessageHandlers() {
    // Player movement
    this.onMessage("player_move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.isAlive) {
        player.x = Math.max(0, Math.min(ARENA_WIDTH, data.x));
        player.y = Math.max(0, Math.min(ARENA_HEIGHT, data.y));
      }
    });
    
    // Player attack
    this.onMessage("player_attack", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.isAlive && this.state.gameStatus === "playing") {
        this.handlePlayerAttack(client, player, data);
      }
    });
    
    // Player ability use
    this.onMessage("use_ability", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.isAlive && this.state.gameStatus === "playing") {
        this.handleAbilityUse(client, player, data);
      }
    });
    
    // Chat during game
    this.onMessage("game_chat", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && data.message) {
        this.broadcast("new_chat", {
          playerId: client.sessionId,
          playerName: player.name,
          message: data.message,
          team: player.team
        });
      }
    });
    
    // Player ready check
    this.onMessage("player_ready", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player && this.state.gameStatus === "waiting") {
        player.health = 100;
        this.checkGameStart();
      }
    });
    
    // Respawn request
    this.onMessage("request_respawn", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player && !player.isAlive && player.respawnTimer <= 0) {
        this.respawnPlayer(player);
      }
    });
  }
  
  handlePlayerAttack(client: Client, attacker: GamePlayer, data: any) {
    const { targetId, attackType, angle, power } = data;
    
    if (attackType === "melee") {
      // Check if target is in range
      const target = this.state.players.get(targetId);
      if (target && target.isAlive && target.team !== attacker.team) {
        const distance = Math.sqrt(
          Math.pow(target.x - attacker.x, 2) + 
          Math.pow(target.y - attacker.y, 2)
        );
        
        if (distance < 50) { // Melee range
          const damage = 25;
          this.damagePlayer(target, attacker, damage);
        }
      }
    } else if (attackType === "ranged") {
      // Create projectile
      const projectile = new Projectile();
      projectile.id = this.generateId();
      projectile.ownerId = attacker.id;
      projectile.x = attacker.x;
      projectile.y = attacker.y;
      projectile.damage = 15;
      projectile.type = "arrow";
      
      // Calculate velocity based on angle
      const speed = 8;
      projectile.velocityX = Math.cos(angle) * speed;
      projectile.velocityY = Math.sin(angle) * speed;
      
      this.state.projectiles.push(projectile);
    }
  }
  
  handleAbilityUse(client: Client, player: GamePlayer, data: any) {
    const { abilityType } = data;
    
    switch (abilityType) {
      case "shield":
        player.health = Math.min(150, player.health + 50);
        this.broadcast("ability_used", {
          playerId: player.id,
          ability: "shield",
          position: { x: player.x, y: player.y }
        });
        break;
        
      case "speed_boost":
        // Speed boost handled client-side
        this.broadcast("ability_used", {
          playerId: player.id,
          ability: "speed_boost",
          position: { x: player.x, y: player.y }
        });
        break;
        
      case "area_attack":
        // Damage all nearby enemies
        this.state.players.forEach((target) => {
          if (target.team !== player.team && target.isAlive) {
            const distance = Math.sqrt(
              Math.pow(target.x - player.x, 2) + 
              Math.pow(target.y - player.y, 2)
            );
            if (distance < 100) {
              this.damagePlayer(target, player, 30);
            }
          }
        });
        
        this.broadcast("ability_used", {
          playerId: player.id,
          ability: "area_attack",
          position: { x: player.x, y: player.y }
        });
        break;
    }
  }
  
  damagePlayer(target: GamePlayer, attacker: GamePlayer, damage: number) {
    target.health -= damage;
    
    if (target.health <= 0) {
      target.health = 0;
      target.isAlive = false;
      target.deaths++;
      target.respawnTimer = RESPAWN_TIME;
      
      attacker.kills++;
      attacker.score += 100;
      
      // Update team score
      if (attacker.team === "red") {
        this.state.redScore++;
      } else {
        this.state.blueScore++;
      }
      
      // Create kill event
      const event = new GameEvent();
      event.id = this.generateId();
      event.type = "kill";
      event.playerId = attacker.id;
      event.targetId = target.id;
      event.message = `${attacker.name} eliminated ${target.name}`;
      event.timestamp = Date.now();
      this.state.events.push(event);
      
      // Broadcast kill feed
      this.broadcast("player_killed", {
        killerId: attacker.id,
        killerName: attacker.name,
        victimId: target.id,
        victimName: target.name,
        killerTeam: attacker.team,
        victimTeam: target.team,
        weapon: attacker.currentWeapon
      });
      
      // Check for double kill
      if (attacker.kills % 2 === 0 && attacker.kills > 0) {
        const doubleKillEvent = new GameEvent();
        doubleKillEvent.id = this.generateId();
        doubleKillEvent.type = "double_kill";
        doubleKillEvent.playerId = attacker.id;
        doubleKillEvent.message = `${attacker.name} DOUBLE KILL! 🔥`;
        doubleKillEvent.timestamp = Date.now();
        this.state.events.push(doubleKillEvent);
        
        this.broadcast("double_kill", {
          playerId: attacker.id,
          playerName: attacker.name,
          team: attacker.team
        });
      }
    }
    
    // Broadcast health update
    this.broadcast("health_update", {
      playerId: target.id,
      health: target.health,
      isAlive: target.isAlive
    });
  }
  
  respawnPlayer(player: GamePlayer) {
    player.isAlive = true;
    player.health = 100;
    player.respawnTimer = 0;
    
    // Spawn at team base
    if (player.team === "red") {
      player.x = 100 + Math.random() * 100;
      player.y = ARENA_HEIGHT / 2;
    } else {
      player.x = ARENA_WIDTH - 200 + Math.random() * 100;
      player.y = ARENA_HEIGHT / 2;
    }
    
    this.broadcast("player_respawned", {
      playerId: player.id,
      playerName: player.name,
      team: player.team,
      position: { x: player.x, y: player.y }
    });
  }
  
  spawnPowerUp() {
    const types = ["health", "speed", "damage", "shield"];
    const powerUp = new PowerUp();
    powerUp.id = this.generateId();
    powerUp.type = types[Math.floor(Math.random() * types.length)];
    powerUp.x = 50 + Math.random() * (ARENA_WIDTH - 100);
    powerUp.y = 50 + Math.random() * (ARENA_HEIGHT - 100);
    
    this.state.powerUps.set(powerUp.id, powerUp);
    
    this.broadcast("powerup_spawned", {
      id: powerUp.id,
      type: powerUp.type,
      x: powerUp.x,
      y: powerUp.y
    });
  }
  
  checkGameStart() {
    const playerCount = this.state.players.size;
    
    if (playerCount >= this.state.minPlayers) {
      const allReady = Array.from(this.state.players.values())
        .every(p => p.health === 100);
      
      if (allReady) {
        this.startCountdown();
      }
    }
  }
  
  startCountdown() {
    this.state.gameStatus = "countdown";
    this.state.countdownTime = 5;
    
    const countdownInterval = setInterval(() => {
      this.state.countdownTime--;
      this.broadcast("countdown", this.state.countdownTime);
      
      if (this.state.countdownTime <= 0) {
        clearInterval(countdownInterval);
        this.startGame();
      }
    }, 1000);
  }
  
  startGame() {
    this.state.gameStatus = "playing";
    this.state.matchTime = 0;
    this.state.redScore = 0;
    this.state.blueScore = 0;
    
    // Reset all players
    this.state.players.forEach((player, sessionId) => {
      player.isAlive = true;
      player.health = 100;
      player.kills = 0;
      player.deaths = 0;
      player.score = 0;
      
      // Spawn players at their team bases
      if (player.team === "red") {
        player.x = 100;
        player.y = ARENA_HEIGHT / 2;
      } else {
        player.x = ARENA_WIDTH - 100;
        player.y = ARENA_HEIGHT / 2;
      }
    });
    
    this.broadcast("game_started", {
      gameTime: this.state.gameTime,
      players: Array.from(this.state.players.entries()).map(([id, p]) => ({
        id: p.id,
        name: p.name,
        team: p.team,
        x: p.x,
        y: p.y
      }))
    });
    
    // Spawn initial power-ups
    for (let i = 0; i < 3; i++) {
      this.spawnPowerUp();
    }
  }
  
  endGame() {
    this.state.gameStatus = "finished";
    
    let winningTeam = this.state.redScore > this.state.blueScore ? "red" : "blue";
    if (this.state.redScore === this.state.blueScore) {
      winningTeam = "draw";
    }
    
    // Calculate MVP
    let mvp = null;
    let highestScore = 0;
    
    this.state.players.forEach((player) => {
      if (player.score > highestScore) {
        highestScore = player.score;
        mvp = {
          id: player.id,
          name: player.name,
          score: player.score,
          kills: player.kills
        };
      }
    });
    
    this.broadcast("game_over", {
      winningTeam,
      redScore: this.state.redScore,
      blueScore: this.state.blueScore,
      mvp,
      playerStats: Array.from(this.state.players.entries()).map(([id, p]) => ({
        id: p.id,
        name: p.name,
        kills: p.kills,
        deaths: p.deaths,
        score: p.score
      }))
    });
    
    // Reset after 30 seconds
    setTimeout(() => {
      this.state.gameStatus = "waiting";
      this.state.redScore = 0;
      this.state.blueScore = 0;
      this.broadcast("game_reset", {});
    }, 30000);
  }
  
  startGameLoop() {
    let lastTime = Date.now();
    
    this.gameLoop = setInterval(() => {
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;
      
      if (this.state.gameStatus === "playing") {
        this.state.matchTime += deltaTime;
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update respawn timers
        this.state.players.forEach((player) => {
          if (!player.isAlive && player.respawnTimer > 0) {
            player.respawnTimer -= deltaTime;
            if (player.respawnTimer <= 0) {
              player.respawnTimer = 0;
            }
          }
        });
        
        // Check game end conditions
        if (this.state.matchTime >= GAME_DURATION) {
          this.endGame();
        }
        
        // Check for team wipe
        this.checkTeamWipe();
      }
    }, 1000 / 60); // 60 FPS game loop
    
    // Power-up spawn loop
    this.powerUpLoop = setInterval(() => {
      if (this.state.gameStatus === "playing") {
        // Remove inactive power-ups
        this.state.powerUps.forEach((powerUp, id) => {
          if (!powerUp.active) {
            this.state.powerUps.delete(id);
          }
        });
        
        // Spawn new power-ups
        if (this.state.powerUps.size < 5) {
          this.spawnPowerUp();
        }
      }
    }, POWERUP_SPAWN_INTERVAL * 1000);
  }
  
  updateProjectiles(deltaTime: number) {
    const projectilesToRemove: string[] = [];
    
    this.state.projectiles.forEach((projectile, index) => {
      // Move projectile
      projectile.x += projectile.velocityX * deltaTime * 60;
      projectile.y += projectile.velocityY * deltaTime * 60;
      
      // Check collision with players
      this.state.players.forEach((player) => {
        if (player.isAlive && player.id !== projectile.ownerId) {
          const owner = this.state.players.get(projectile.ownerId);
          if (owner && player.team !== owner.team) {
            const distance = Math.sqrt(
              Math.pow(player.x - projectile.x, 2) + 
              Math.pow(player.y - projectile.y, 2)
            );
            
            if (distance < 20) {
              this.damagePlayer(player, owner, projectile.damage);
              projectilesToRemove.push(projectile.id);
            }
          }
        }
      });
      
      // Remove if out of bounds
      if (projectile.x < 0 || projectile.x > ARENA_WIDTH || 
          projectile.y < 0 || projectile.y > ARENA_HEIGHT) {
        projectilesToRemove.push(projectile.id);
      }
    });
    
    // Remove projectiles
    projectilesToRemove.forEach(id => {
      const index = this.state.projectiles.findIndex(p => p.id === id);
      if (index !== -1) {
        this.state.projectiles.splice(index, 1);
      }
    });
    
    // Broadcast projectile updates
    if (this.state.projectiles.length > 0) {
      this.broadcast("projectiles_update", 
        Array.from(this.state.projectiles).map(p => ({
          id: p.id,
          x: p.x,
          y: p.y,
          type: p.type
        }))
      );
    }
  }
  
  checkTeamWipe() {
    let redAlive = false;
    let blueAlive = false;
    
    this.state.players.forEach((player) => {
      if (player.isAlive) {
        if (player.team === "red") redAlive = true;
        if (player.team === "blue") blueAlive = true;
      }
    });
    
    if (!redAlive || !blueAlive) {
      const wipedTeam = !redAlive ? "red" : "blue";
      const winningTeam = wipedTeam === "red" ? "blue" : "red";
      
      this.broadcast("team_wipe", {
        wipedTeam,
        winningTeam
      });
      
      // Bonus points for team wipe
      this.state[winningTeam === "red" ? "redScore" : "blueScore"] += 3;
    }
  }
  
  onJoin(client: Client, options: any) {
    console.log(`${client.sessionId} joined Colosseum as "${options.name}"`);
    
    // Create new player
    const player = new GamePlayer();
    player.id = client.sessionId;
    player.name = options.name || `Gladiator_${client.sessionId.substr(0, 4)}`;
    
    // Assign team (balance teams)
    let redCount = 0;
    let blueCount = 0;
    
    this.state.players.forEach((p) => {
      if (p.team === "red") redCount++;
      if (p.team === "blue") blueCount++;
    });
    
    player.team = redCount <= blueCount ? "red" : "blue";
    
    // Add player to state
    this.state.players.set(client.sessionId, player);
    
    // Send current game state to new player
    client.send("game_state", {
      playerId: client.sessionId,
      gameStatus: this.state.gameStatus,
      gameTime: this.state.gameTime,
      matchTime: this.state.matchTime,
      players: Array.from(this.state.players.entries()).map(([id, p]) => ({
        id: p.id,
        name: p.name,
        team: p.team,
        x: p.x,
        y: p.y,
        score: p.score,
        kills: p.kills
      })),
      powerUps: Array.from(this.state.powerUps.entries()).map(([id, p]) => ({
        id: p.id,
        type: p.type,
        x: p.x,
        y: p.y
      })),
      recentEvents: this.state.events.slice(-10)
    });
    
    // Broadcast player join
    this.broadcast("player_joined_game", {
      id: player.id,
      name: player.name,
      team: player.team
    });
    
    // Check if game can start
    if (this.state.gameStatus === "waiting") {
      this.checkGameStart();
    }
  }
  
  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      console.log(`${player.name} left the Colosseum`);
      
      this.state.players.delete(client.sessionId);
      
      this.broadcast("player_left_game", {
        id: player.id,
        name: player.name,
        team: player.team
      });
      
      // Check if game should end due to too few players
      if (this.state.players.size < this.state.minPlayers && 
          this.state.gameStatus === "playing") {
        this.endGame();
      }
    }
  }
  
  onDispose() {
    console.log("Colosseum Game Room disposed:", this.roomId);
    
    // Clear game loops
    if (this.gameLoop) clearInterval(this.gameLoop);
    if (this.powerUpLoop) clearInterval(this.powerUpLoop);
  }
  
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}