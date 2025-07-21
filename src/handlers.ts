import { WebSocket, RawData } from 'ws';
import { addUtteranceToTranscript, getTranscript, json, promptLLM } from './utils';
import { Message, MessageType, Participant } from './models';
import { randomUUID } from 'node:crypto';

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
        type: MessageType.UNEXPECTED_MESSAGE_TYPE,
        content: `received unexpected message type: ${message.type}`,
      })
    );
  };
};

export const handleSession = (ws: WebSocket) => {
  return async (message: Message) => {
    const { sessionId, clientId } = message;
    ws.send(
      json({
        clientId,
        sessionId: sessionId ?? randomUUID(),
        type: MessageType.SESSION,
        content: null,
      })
    );
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
          content: null,
        })
      );
    };
    heartbeat();
    setInterval(heartbeat, 6000);
  };
};

export const handleChat = (ws: WebSocket) => {
  return async (message: Message) => {
    const { clientId, sessionId, content } = message;
    const userUtterance = {
      clientId,
      sessionId,
      text: (content as { text: string }).text,
      participant: Participant.USER,
      timestamp: Date.now(),
    };
    await addUtteranceToTranscript(message, userUtterance);
    ws.send(
      json({
        clientId,
        sessionId,
        type: MessageType.BOT_THINKING,
        content: null,
      })
    );
    const botUtterance = {
      clientId,
      sessionId,
      text: await promptLLM((message.content as { text: string }).text),
      participant: Participant.BOT,
      timestamp: Date.now(),
    };
    ws.send(
      json({
        clientId,
        sessionId,
        type: MessageType.CHAT,
        content: botUtterance,
      })
    );
    await addUtteranceToTranscript(message, botUtterance);
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
