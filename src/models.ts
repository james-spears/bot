export enum MessageType {
  CONNECT = 'connect',
  HEARTBEAT = 'heartbeat',
  DISCONNECT = 'disconnect',
  ECHO = 'echo',
  START = 'start',
  CHAT = 'chat',
  ERROR = 'error',
  TYPING = 'typing',
  SESSION = 'session',
  THINKING = 'thinking',
  TRANSCRIPT = 'transcript',
  UNEXPECTED = 'unexpected',
}

export interface Message {
  type: MessageType;
  content: unknown;
  clientId: string;
  sessionId: string;
}

export enum Participant {
  BOT = 'bot',
  AGENT = 'agent',
  USER = 'user',
}

export interface Utterance {
  clientId: string;
  sessionId: string;
  text: string;
  participant: Participant;
  timestamp: number;
}

export type Transcript = Utterance[];

export interface Models {
  messgage: Message;
}
