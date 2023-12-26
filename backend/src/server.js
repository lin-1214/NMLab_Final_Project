import http from "http";
import express from "express";
import mongoose from "mongoose";
import WebSocket from "ws";
import mongo from "./mongo";
import wsConnect from "./wsConnect";
import { v4 as uuidv4 } from "uuid";
mongo.connect();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server: server });
const db = mongoose.connection;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

db.once("open", () => {
    console.log("MongoDB connected!");
    wss.on("connection", (ws) => {
        console.log("hi");
        // await delay(500);
        // wsConnect.initData(ws);
        ws.id = uuidv4();
        ws.box = "";
        // wsConnect.onMessage(ws);
        wsConnect.onChatBoxMessage(wss, ws);
        // Define WebSocket connection logic
    });
});
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
    console.log(`Example app listening on port ${PORT}!`)
);
