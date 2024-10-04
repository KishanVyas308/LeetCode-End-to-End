import express from "express";
import { createClient } from "redis";
import { WebSocketServer } from "ws";

const app = express();
app.use(express.json());

const redisClient = createClient();
const pubSubClient = createClient(); // Redis client for Pub/Sub
const userConnections : any = {}; // Store user WebSocket connections

redisClient.on("error", (err) => console.log("Redis Client Error", err));
pubSubClient.on("error", (err) => console.log("Redis PubSub Client Error", err));

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req) => {
  const userId : any = req.headers['sec-websocket-key']; // Some identifier for the user (can be userId)
  userConnections[userId] = ws;

  ws.on('close', () => {
    delete userConnections[userId]; // Cleanup on disconnect
  });
});

app.post("/submit", async (req, res) => {
  const { problemId, code, language, userId } = req.body;
  const submissionId = `submission-${Date.now()}-${userId}`;

  try {
    // Push submission to Redis
    await redisClient.lPush("problems", JSON.stringify({ problemId, code, language, userId, submissionId }));
    
    // Subscribe to the channel for this specific submission
    pubSubClient.subscribe(submissionId, (message) => {
        console.log(`Received message: ${message}`);
        // Process the message or do whatever you need here
      });

    pubSubClient.on('message', (channel, message) => {
      if (channel === submissionId) {
        const ws : any = userConnections[userId];
        if (ws) {
          ws.send(message); // Send the result back to the user's WebSocket
        }
        pubSubClient.unsubscribe(submissionId); // Unsubscribe after sending result
      }
    });

    res.status(200).send("Submission received and stored");
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to store submission");
  }
});

const server = app.listen(3000, () => {
  console.log("Express Server Listening on port 3000");
});

server.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

async function main() {
  try {
    await redisClient.connect();
    await pubSubClient.connect();
    console.log("Redis Client Connected");
  } catch (error) {
    console.log("Failed to connect to Redis", error);
  }
}

main();
