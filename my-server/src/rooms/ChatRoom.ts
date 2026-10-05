import { Room, Client } from "colyseus";
import { Schema, type, ArraySchema } from "@colyseus/schema";

export class Message extends Schema {
  @type("string") user: string;
  @type("string") message: string;
  @type("number") timestamp: number;
}

export class ChatRoomState extends Schema {
  @type([Message]) messages = new ArraySchema<Message>();
}

export class ChatRoom extends Room<ChatRoomState> {
  maxClients = 50;

  onCreate(options: any) {
    console.log("ChatRoom created!", options);
    this.setState(new ChatRoomState());

    // Handle message events from clients
    this.onMessage("message", (client, message) => {
      console.log("Received message from", client.sessionId, ":", message);
      
      // Create new message
      const newMessage = new Message();
      newMessage.user = message.user;
      newMessage.message = message.message;
      newMessage.timestamp = message.timestamp || Date.now();

      // Add to room state
      this.state.messages.push(newMessage);

      // Limit messages to last 100 to prevent memory issues
      if (this.state.messages.length > 100) {
        this.state.messages.shift();
      }

      // Broadcast the message to all clients
      this.broadcast("message", newMessage);
    });
  }

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined ChatRoom with options:", options);
    
    // Send welcome message
    const welcomeMessage = new Message();
    welcomeMessage.user = "System";
    welcomeMessage.message = `Welcome ${options.username || client.sessionId}!`;
    welcomeMessage.timestamp = Date.now();
    
    this.state.messages.push(welcomeMessage);
    this.broadcast("message", welcomeMessage);
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left ChatRoom");
    
    const leaveMessage = new Message();
    leaveMessage.user = "System";
    leaveMessage.message = `${client.sessionId} left the chat`;
    leaveMessage.timestamp = Date.now();
    
    this.state.messages.push(leaveMessage);
    this.broadcast("message", leaveMessage);
  }

  onDispose() {
    console.log("ChatRoom disposed");
  }
}