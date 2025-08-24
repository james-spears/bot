import { Message, Participant, Transcript, Utterance } from './models';
import db from './db';
import validators from './validators';

if (!process.env.GEMINI_API_KEY) throw new Error('gemini api key unset');
if (!process.env.GEMINI_MODEL_URL) throw new Error('gemini url unset');

const getDefaultUtterance = async (message: Message): Promise<Utterance> => {
  const { clientId, sessionId } = message;
  return {
    clientId,
    sessionId,
    text: 'Hello! How can I help you?',
    participant: Participant.BOT,
    timestamp: Date.now() + 1,
  };
};

export const json = (message: Message) =>
  validators.message(message)
    ? JSON.stringify(message)
    : (() => {
        throw new Error('cannot return invalid message');
      })();

// export const getSessionId = async () => {
//   return randomUUID();
// };

export const getTranscript = async (message: Message): Promise<Transcript> => {
  const { sessionId } = message;
  // transcript does not need to be sorted
  const transcript = await db.utterances.find<Utterance>({ sessionId }).toArray();
  if (!transcript.length) {
    const utterance = await getDefaultUtterance(message);
    const res = await db.utterances.insertOne(utterance);
    console.log('res: ', res);
    return [utterance];
  }
  return transcript;
};

export const addUtteranceToTranscript = async (
  message: Message,
  utterance: Utterance
): Promise<Transcript> => {
  const transcript = await getTranscript(message);
  transcript.push(utterance);
  await db.utterances.insertOne(utterance);
  return transcript;
};

// export const getResponse = async (utterance: Utterance): Promise<Utterance> => {
//   return {
//     text: "I'm sorry. I don't understand.",
//     participant: Participant.BOT,
//     timestamp: Date.now(),
//     uuid: randomUUID(),
//   };
// };
