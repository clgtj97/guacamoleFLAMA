declare module "colyseus" {
  export class Client {
    sessionId: string;
    send(type: string, message: any): void;
  }

  export class Room<State = any> {
    roomId: string;
    maxClients: number;
    state: State;
    setState(state: State): void;
    onCreate?(options: any): void;
    onJoin?(client: Client, options: any): void;
    onLeave?(client: Client, consented: boolean): void;
    onDispose?(): void;
    onMessage(type: string, callback: (client: Client, message: any) => void): void;
    broadcast(type: string, message: any, options?: any): void;
    setMetadata(metadata: any): void;
  }
}
