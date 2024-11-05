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

    const queryParams = new URLSearchParams(req.url?.split("?")[1]);
    let roomId = queryParams.get("roomId"); // Get roomId from query param if provided
    const userId = queryParams.get("id"); // Get userId from query param
    const name = queryParams.get("name"); // Get name from query param
    console.log("User id", userId);
    console.log("Room id", roomId);
    console.log("Name", name);

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
    const users = rooms[roomId].map((user: any) => ({
      id: user.userId,
      name: user.name,
    }));
    rooms[roomId].forEach((user: any) => {
      user.ws.send(JSON.stringify({ type: "users", users }));
    });

    rooms[roomId].push({ userId, ws, name });
    console.log("all room", rooms);

    pubSubClient.subscribe(roomId, (message) => {
      // Broadcast message to all users in the room
      rooms[roomId].forEach((user: any) => {
        if (user.userId === userId) {
          user.ws.send(JSON.stringify({ type: "output", message }));
          console.log("Output sent to user id", user.id);
        }
      });
    });

    ws.on("message", (message) => {
      const data = JSON.parse(message.toString());

      console.log("Message received", data.type);

      // handle request from user and send it all back to all users in the room
      if (data.type === "requestToGetUsers") {
        const users = rooms[roomId].map((user: any) => ({
          id: user.userId,
          name: user.name,
        }));
        console.log("request recived");

        rooms[roomId].forEach((user: any) => {
          user.ws.send(JSON.stringify({ type: "users", users: users }));
        });
      }

      // request for starter data on new user join
      if (data.type == "requestForAllData") {
        

        const otherUser = rooms[roomId].find(
          (user: any) => user.userId !== userId
        );
        if (otherUser) {
          console.log("sending request to", otherUser.name);
          otherUser.ws.send(
            JSON.stringify({
              type: "requestForAllData",
              userId: userId,
            })
          );
        }
      }

      // handle code change and send it to all users in the room
      if (data.type === "code") {
        rooms[roomId].forEach((user: any) => {
          if (user.userId != userId) {
            user.ws.send(JSON.stringify({ type: "code", code: data.code }));
          }
        });
      }
      // handle input change and send it to all users in the room
      if (data.type === "input") {
        rooms[roomId].forEach((user: any) => {
          if (user.userId != userId) {
            user.ws.send(JSON.stringify({ type: "input", input: data.input }));
          }
        });
      }

      // handle language change and send it to all users in the room
      if (data.type === "language") {
        rooms[roomId].forEach((user: any) => {
          if (user.userId != userId) {
            user.ws.send(
              JSON.stringify({ type: "language", language: data.language })
            );
          }
        });
      }

      // handle submit button status
      if (data.type === "submitBtnStatus") {
        rooms[roomId].forEach((user: any) => {
          if (user.userId != userId) {
            user.ws.send(
              JSON.stringify({
                type: "submitBtnStatus",
                value: data.value,
                isLoading: data.isLoading,
              })
            );
          }
        });
      }

      // handle user added
      if (data.type === "users") {
        rooms[roomId].forEach((user: any) => {
          if (user.userId != userId) {
            user.ws.send(JSON.stringify({ type: "users", users: data.users }));
          }
        });
      }

      // send all data to new user
      if (data.type === "allData") {
       
        
        rooms[roomId].forEach((user: any) => {
          if (user.userId === data.userId) {
            console.log("sending all data to", user.name , "and data is", data);
            
            user.ws.send(
              JSON.stringify({
                type: "allData",
                code: data.code,
                input: data.input,
                language: data.language,
                currentButtonState: data.currentButtonState,
                isLoading: data.isLoading,
              })
            );
          }
        });
      }

      // send current cursor position to all users in the room
      if (data.type === "cursorPosition") {
        rooms[roomId].forEach((user: any) => {
          if (user.userId != userId) {
            user.ws.send(
              JSON.stringify({
                type: "cursorPosition",
                cursorPosition: data.cursorPosition,
                userId: userId,
              })
            );
          }
        });
      }
    });

    ws.on("close", () => {
      // remove user from room
      rooms[roomId] = rooms[roomId].filter(
        (user: any) => user.userId !== userId
      );

      // send updated users list to all users in the room
      rooms[roomId].forEach((user: any) => {
        user.ws.send(JSON.stringify({ type: "users", users }));
      });
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
        pubSubClient.unsubscribe(roomId);
      }

      console.log("all room", rooms);
    });
  });

  wss.on("listening", () => {
    const addr: any = server.address();
    console.log(`Server listening on port ${addr.port}`);
  });

  server.listen(5000, '0.0.0.0', () => {
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
