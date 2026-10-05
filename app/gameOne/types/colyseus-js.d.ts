declare module 'colyseus.js' {
  export class Client {
    constructor(endpoint: string);
    joinOrCreate<T = any>(roomName: string, options?: any): Promise<Room<T>>;
  }

  export class Room<T = any> {
    id: string;
    sessionId: string;
    state: T;
    onStateChange(callback: (state: T) => void): void;
    onMessage(type: string, callback: (message: any) => void): void;
    onLeave(callback?: (code?: number) => void): void;
    send(type: string, message?: any): void;
    leave(consented?: boolean): Promise<void> | void;
  }
}
