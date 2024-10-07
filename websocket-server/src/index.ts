import http from "http";
import { WebSocketServer } from "ws";
import { createClient } from "redis";

const server = http.createServer();
const wss = new WebSocketServer({ server });
const pubSubClient = createClient();

async function process() {
  pubSubClient.on("error", (err) =>
    console.log("Redis PubSub Client Error", err)
  );

  const connectedUsers: any = {};

  wss.on("connection", (ws, req) => {
    console.log("Connection established");
    const userId: any = req.headers["sec-websocket-protocol"];
    console.log(`New user connected: ${userId}`);

    connectedUsers[userId] = ws;
    pubSubClient.subscribe(userId, (message) => {
      console.log(`Received message: ${message}`);
      ws.send(message);
    });

    ws.on("close", () => {
      console.log("connection closed user id", userId);
      delete connectedUsers[userId];
      pubSubClient.unsubscribe(userId);
    });
  });



  wss.on("listening", () => {
    const addr: any = server.address();
    console.log(`Server listening on port ${addr.port}`);
  });

  server.listen(5000, () => {
    console.log("web socket server started on 5000");
  });
}
async function main() {
  try {
    await pubSubClient.connect();
    await process();
    console.log("Redis Client Connected");
  } catch (error) {
    console.log("Failed to connect to Redis", error);
  }
}

main();
