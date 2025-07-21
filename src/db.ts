import { MongoClient, ServerApiVersion } from 'mongodb';
// Replace the placeholder with your Atlas connection string
if (!process.env.MONGODB_CONNECTION_URI) throw new Error('mongodb connection uri unset');
const uri = process.env.MONGODB_CONNECTION_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

await client.connect();
// Send a ping to confirm a successful connection
await client.db('chat').command({ ping: 1 });
client.db('chat').collection('utterances').createIndex({ sessionId: 1, timestamp: 1 });
console.log('Pinged your deployment. You successfully connected to MongoDB!');

export default {
  utterances: client.db('chat').collection('utterances'),
};
