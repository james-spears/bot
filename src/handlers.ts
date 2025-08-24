import { WebSocket, RawData } from 'ws';
import { addUtteranceToTranscript, getTranscript, json } from './utils';
import { Message, MessageType, Participant } from './models';
import { randomUUID } from 'node:crypto';
import prompt from './ai';
import { rooms } from './cnx';

export const handleConnection = (ws: WebSocket) => {
  return () => {
    ws.send(
      json({
        type: MessageType.CONNECT,
        content: {
          message: 'connected successfully',
        },
        sessionId: '',
        clientId: '',
      })
    );
  };
};

export const handleClose = (code: number, reason: Buffer) => {
  console.log(`client closed connection: code ${code}: reason ${reason.toString()}`);
};

export const handleEcho = (ws: WebSocket) => {
  return (message: Message) => {
    ws.send(
      json({
        ...message,
        type: MessageType.ECHO,
        content: `received: ${message.content}`,
      })
    );
  };
};

export const handleUnexpectedMessageType = (ws: WebSocket) => {
  return (message: Message) => {
    ws.send(
      json({
        ...message,
        type: MessageType.UNEXPECTED,
        content: `received unexpected message type: ${message.type}`,
      })
    );
  };
};

export const handleSession = (ws: WebSocket) => {
  return async (message: Message) => {
    if (!message.sessionId) {
      message.sessionId = randomUUID();
    }
    const { sessionId, clientId } = message;
    if (!rooms[sessionId]) {
      rooms[sessionId] = []; // Create room if it doesn't exist
    }
    rooms[sessionId].push(ws);
    (ws as WebSocket & { sessionId: string }).sessionId = sessionId; // Assign sessionId to the client's WebSocket object
    console.log(`Client ${clientId} joined room ${sessionId}`);
    // Notify clients in the room about the new member
    rooms[sessionId].forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'joined', clientId }));
      }
    });
    ws.send(
      json({
        clientId,
        sessionId,
        type: MessageType.SESSION,
        content: '',
      })
    );
    handleTranscript(ws)(message);
  };
};

export const handleTranscript = (ws: WebSocket) => {
  return async (message: Message) => {
    const { sessionId, clientId } = message;
    if (sessionId) {
      ws.send(
        json({
          clientId,
          sessionId,
          type: MessageType.TRANSCRIPT,
          content: await getTranscript(message),
        })
      );
    }
  };
};

export const handleHeartbeat = (ws: WebSocket) => {
  return async (message: Message) => {
    const { clientId, sessionId } = message;
    if (!clientId || !sessionId) {
      return;
    }
    const heartbeat = () => {
      ws.send(
        json({
          clientId,
          sessionId,
          type: MessageType.HEARTBEAT,
          content: '',
        })
      );
    };
    heartbeat();
    setInterval(heartbeat, 6000);
  };
};

export const handleChat = (ws: WebSocket & { sessionId?: string }) => {
  return async (message: Message) => {
    const { clientId, sessionId, content } = message;
    await addUtteranceToTranscript(message, {
      clientId,
      sessionId,
      text: (content as { text: string }).text,
      participant: Participant.USER,
      timestamp: Date.now(),
    });
    if (ws.sessionId && rooms[ws.sessionId]) {
      rooms[ws.sessionId].forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            json({
              clientId,
              sessionId,
              type: MessageType.THINKING,
              content: '',
            })
          );
        }
      });
    }
    await addUtteranceToTranscript(message, await prompt(ws)(message));
  };
};

export const handleError = (ws: WebSocket) => {
  return (data: RawData) => {
    ws.send(
      json({
        clientId: '',
        sessionId: '',
        type: MessageType.ERROR,
        content: `unexpected error: ${data}`,
      })
    );
  };
};
