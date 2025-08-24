import { GoogleGenAI } from '@google/genai';
import { WebSocket } from 'ws';
import { Message, MessageType, Participant } from './models';
import { json } from './utils';
import { rooms } from './cnx';

function prompter(ws: WebSocket & { sessionId?: string }) {
  return async (message: Message) => {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    const config = {
      responseMimeType: 'text/plain',
    };
    const model = 'gemini-2.0-flash';
    const text = (message.content as { text: string }).text;
    const contents = [
      {
        role: 'user',
        parts: [
          {
            text,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });
    let index = 0;
    const { clientId, sessionId } = message;
    const content = {
      clientId,
      sessionId,
      text: '',
      participant: Participant.BOT,
      timestamp: Date.now(),
    };
    for await (const chunk of response) {
      content.text += chunk.text;
      if (ws.sessionId && rooms[ws.sessionId]) {
        rooms[ws.sessionId].forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(
              json({
                clientId,
                sessionId,
                type: !index ? MessageType.START : MessageType.CHAT,
                content,
              })
            );
          }
        });
      }
      // ws.send(
      //   json({
      //     clientId,
      //     sessionId,
      //     type: !index ? MessageType.START : MessageType.CHAT,
      //     content,
      //   })
      // );
      index++;
    }
    return content;
  };
}

export default prompter;
