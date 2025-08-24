import { WebSocket } from 'ws';
import {
  handleChat,
  handleError,
  handleHeartbeat,
  handleSession,
  handleTranscript,
  handleUnexpectedMessageType,
} from './handlers';
import { RawData } from 'ws';
import { Message, MessageType } from './models';
import validators from './validators';
// test
export default (ws: WebSocket & { sessionId?: string; }) => {
  return async (data: RawData): Promise<void> => {
    try {
      const message: Message = JSON.parse(data.toString());
      const valid = validators.message(message);
      if (valid) {
        switch (message.type) {
          case MessageType.CHAT:
            return handleChat(ws)(message);
          case MessageType.SESSION:
            return handleSession(ws)(message);
          case MessageType.TRANSCRIPT:
            return handleTranscript(ws)(message);
          case MessageType.HEARTBEAT:
            return handleHeartbeat(ws)(message);
          default:
            return handleUnexpectedMessageType(ws)(message);
        }
      } else {
        throw new Error(`message is invalid: ${JSON.stringify(validators.message.errors)}`);
      }
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        // handle error
        return handleError(ws)(data);
      }
    }
  };
};
