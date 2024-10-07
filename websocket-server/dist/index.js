"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const ws_1 = require("ws");
const redis_1 = require("redis");
const server = http_1.default.createServer();
const wss = new ws_1.WebSocketServer({ server });
const pubSubClient = (0, redis_1.createClient)();
function process() {
    return __awaiter(this, void 0, void 0, function* () {
        pubSubClient.on("error", (err) => console.log("Redis PubSub Client Error", err));
        const connectedUsers = {};
        wss.on("connection", (ws, req) => {
            console.log("Connection established");
            const userId = req.headers["sec-websocket-protocol"];
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
            const addr = server.address();
            console.log(`Server listening on port ${addr.port}`);
        });
        server.listen(5000, () => {
            console.log("web socket server started on 5000");
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield pubSubClient.connect();
            yield process();
            console.log("Redis Client Connected");
        }
        catch (error) {
            console.log("Failed to connect to Redis", error);
        }
    });
}
main();
