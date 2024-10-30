import http from "http";
import { WebSocketServer } from "ws";
import { createClient } from "redis";

const server = http.createServer();
const wss = new WebSocketServer({ server });
const pubSubClient = createClient();

// Storage for rooms and their users
const rooms: any = {};

// Helper to generate a unique 6-digit room ID
function generateRoomId() {
  let id;
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit random number
  } while (rooms[id]);
  return id;
}

async function process() {
  pubSubClient.on("error", (err) =>
    console.log("Redis PubSub Client Error", err)
  );

  wss.on("connection", (ws, req) => {
    console.log("Connection established");
    const userId: any = req.headers["sec-websocket-protocol"];
    console.log(`New user connected: ${userId}`);
    let roomId = req.url?.split("?roomId=")[1]; // Get roomId from query param if provided

   
    // If no roomId, generate a new roomId and add the user as the first member
    if (roomId == null || roomId == "" || !rooms[roomId]) {
      roomId = generateRoomId();
      rooms[roomId] = [];
      ws.send(
        JSON.stringify({
          isNewRoom: true,
          type: "roomId",
          roomId,
          message: `Created new room with ID: ${roomId}`,
        })
      );
      console.log(`Created new room with ID: ${roomId}`);
    } else {
      console.log(`Joining room with ID: ${roomId}`);
      ws.send(
        JSON.stringify({
          isNewRoom: false,
          type: "roomId",
          roomId,
          message: `Joined room with ID: ${roomId}`,
        })
      );
    }

    rooms[roomId].push({ userId, ws });
    console.log("all room", rooms);
    
    pubSubClient.subscribe(roomId, (message) => {
      // Broadcast message to all users in the room
      rooms[roomId].forEach((user: any) => {
        user.ws.send({ type: "output", message });
        console.log("Output sent to user id", user.userId);
      });
    });

    ws.on("close", () => {
      // console.log("connection closed user id", userId);
      // delete connectedUsers[userId];
      // pubSubClient.unsubscribe(userId);
      // close conenction and if room is empty delete the room
      // remove user from room
      rooms[roomId] = rooms[roomId].filter(
        (user: any) => user.userId !== userId
      );
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }

      console.log("all room", rooms);
      
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
