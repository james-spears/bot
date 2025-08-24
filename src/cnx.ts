import { WebSocket } from "ws";

// Store active connections (clients) and rooms
export const clients = new Set();
export const rooms: Record<string, WebSocket[]> = {}; // Object to store rooms, e.g., { 'sessionId': [ws1, ws2] }
