// my-server/src/rooms/FerrariMetaverseRoom.ts
// @ts-nocheck
import { Room, Client } from "colyseus";
import { FerrariRoomState } from "./schema/FerrariRoomState";
import { FerrariPlayer } from "./schema/FerrariPlayer";
import { ChatMessage } from "./schema/ChatMessage";

export class FerrariMetaverseRoom extends Room<FerrariRoomState> {
  maxClients = 50;
  state = new FerrariRoomState();
  private readonly idleTimeoutMs = 140;
  private idleCheckLoop!: ReturnType<typeof setInterval>;
  
  // Room created
  onCreate(options: any) {
    console.log("🏎️ Ferrari Metaverse Room created!", options);

    // Setup message handlers
    this.setupMessageHandlers();

    // If movement updates stop arriving, snap the avatar back to idle quickly
    // so remote viewers do not see a lingering walk cycle.
    this.idleCheckLoop = setInterval(() => {
      const now = Date.now();

      this.state.players.forEach((player) => {
        if (player.currentAnimation !== "walk") return;
        if (now - player.lastMoveAt <= this.idleTimeoutMs) return;

        player.currentAnimation = "idle";
      });
    }, 80);
  }
  
  setupMessageHandlers() {
    // Player movement
    this.onMessage("player_move", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.direction = data.direction;
        player.currentAnimation = data.animation;
        player.roomId = data.roomId;
        player.lastMoveAt = Date.now();
      }
    });
    
    // Chat messages
    this.onMessage("chat_message", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player && data.content && data.content.trim() !== "") {
        this.handleChatMessage(client, player, data);
      }
    });
    
    // Player actions (wave, dance, etc.)
    this.onMessage("player_action", (client, data) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.currentAnimation = data.action;
        this.broadcast("player_acted", {
          playerId: client.sessionId,
          playerName: player.name,
          action: data.action
        });
      }
    });
  }
  
  handleChatMessage(client: Client, player: FerrariPlayer, data: any) {
    // Create new message
    const message = new ChatMessage();
    message.id = Date.now().toString();
    message.playerId = client.sessionId;
    message.playerName = player.name;
    message.content = data.content.trim();
    message.timestamp = Date.now();
    message.type = data.type || "text";
    
    // Add to chat history
    this.state.chatMessages.push(message);
    
    // Keep only last 100 messages
    if (this.state.chatMessages.length > 100) {
      this.state.chatMessages.shift();
    }
    
    console.log(`💬 [${this.roomId}] ${player.name}: ${message.content}`);
    
    // Broadcast to everyone in room
    this.broadcast("new_chat_message", {
      id: message.id,
      playerId: message.playerId,
      playerName: message.playerName,
      content: message.content,
      timestamp: message.timestamp,
      type: message.type
    });
  }
  
  // Player joins
  onJoin(client: Client, options: any) {
    console.log(`${client.sessionId} joined as "${options.name}"`);
    
    // Create player
    const player = new FerrariPlayer();
    player.id = client.sessionId;
    player.sessionId = client.sessionId;
    player.name = options.name || `Guest_${client.sessionId.substr(0, 4)}`;
    player.x = 400; // Middle of screen
    player.y = 0;   // On walking line
    player.isClubMember = options.isClubMember || false;
    player.roomId = "outside";
    player.lastMoveAt = Date.now();
    
    // Add to room
    this.state.players.set(client.sessionId, player);
    
    // Send welcome message
    this.broadcast("player_joined", {
      id: player.id,
      name: player.name,
      x: player.x,
      y: player.y
    }, { except: client });
    
    // Send system welcome in chat
    const welcomeMsg = new ChatMessage();
    welcomeMsg.id = Date.now().toString();
    welcomeMsg.playerId = "system";
    welcomeMsg.playerName = "System";
    welcomeMsg.content = `🏎️ ${player.name} has entered the Ferrari Metaverse!`;
    welcomeMsg.timestamp = Date.now();
    this.state.chatMessages.push(welcomeMsg);
    
    // Send current players and chat history to new player
    client.send("room_state", {
      players: Array.from(this.state.players.entries()).map(([id, p]) => ({
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        direction: p.direction,
        currentAnimation: p.currentAnimation,
        roomId: p.roomId
      })),
      chatHistory: this.state.chatMessages.slice(-20) // Last 20 messages
    });
  }
  
  // Player leaves
  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      console.log(`${player.name} left the room`);
      
      // Remove from room
      this.state.players.delete(client.sessionId);
      
      // Broadcast leave
      this.broadcast("player_left", {
        id: player.id,
        name: player.name
      });
      
      // System message
      const goodbyeMsg = new ChatMessage();
      goodbyeMsg.id = Date.now().toString();
      goodbyeMsg.playerId = "system";
      goodbyeMsg.playerName = "System";
      goodbyeMsg.content = `👋 ${player.name} has left the metaverse`;
      goodbyeMsg.timestamp = Date.now();
      this.state.chatMessages.push(goodbyeMsg);
    }
  }
  
  onDispose() {
    clearInterval(this.idleCheckLoop);
    console.log("Room disposed:", this.roomId);
  }
}