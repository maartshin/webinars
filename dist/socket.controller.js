"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const janus_srv_1 = require("./services/janus.srv");
const cookieParser = require("cookie-parser");
const connection_1 = require("./models/connection");
const events_1 = require("events");
class SocketController {
    constructor() {
        this.janusService = new janus_srv_1.JanusService();
        this.sessions = {};
        this.connections = [];
        this.eventEmitter = new events_1.EventEmitter();
        this.addEventListeners();
    }
    static init(ws, req) {
        let controller = new SocketController();
        let connection = controller.addConnection(ws);
        controller.addEvents(connection);
    }
    addConnection(ws) {
        let connection = new connection_1.Connection(ws);
        this.janusService.connect(connection);
        this.connections.push(connection);
        console.log("adding connection");
        console.log(connection.getSession());
        return connection;
    }
    addSession(req) {
        console.log("Adding session");
        cookieParser()(req, null, (err) => {
            console.log("parsing cookie");
            var sessionID = req.signedCookies;
            console.log(req.session);
            console.log(sessionID);
        });
    }
    addEvents(connection) {
        let ws = connection.getSocket();
        ws.on("message", (message) => {
            let data;
            try {
                data = JSON.parse(message);
            }
            catch (e) {
                ws.send(JSON.stringify({ error: "Not a json object." }));
                return;
            }
            this.invokeEvent(connection, data);
        });
        ws.on("close", () => {
            connection.getSession().destroy().then(() => {
                console.log("Janus Gateway session destroyed");
            });
        });
    }
    addEventListeners() {
        this.eventEmitter.on("new", this.createRoom);
        this.eventEmitter.on("connection", this.connectionInfo);
        this.eventEmitter.on("publish", this.publishFeed);
        this.eventEmitter.on("feeds", this.getFeeds);
        this.eventEmitter.on("ice", this.trickleIce);
        this.eventEmitter.on("onanswer", this.onAnswer);
        this.eventEmitter.on("rooms", this.getRooms);
        this.eventEmitter.on("stoprecording", this.stopRecording);
    }
    invokeEvent(connection, data) {
        let ws = connection.getSocket();
        switch (data["event"]) {
            case "new":
                this.createRoom(connection, data);
                break;
            case "connection":
                this.connectionInfo(connection);
                break;
            case "publish":
                this.publishFeed(connection, data);
                break;
            case "feeds":
                this.getFeeds(connection, data);
                break;
            case "ice":
                this.trickleIce(connection, data);
                break;
            case "onanswer":
                this.onAnswer(connection, data);
                break;
            case "rooms":
                this.getRooms(connection, data);
                break;
            case "stoprecording":
                this.stopRecording(connection, data);
                break;
            default:
                ws.send(JSON.stringify({ event: "error", error: "Unknown event" }));
                break;
        }
    }
    getRooms(connection, data) {
        console.log("getting rooms");
        this.janusService.getRooms(connection);
    }
    connectToJanus(ws) {
        this.socket.send(JSON.stringify({ message: "Connected to janus" }));
    }
    createRoom(connection, data) {
        console.log("creating room");
        console.log(data);
        this.janusService.createRoom(connection, data.options);
    }
    onAnswer(connection, data) {
        console.log("answer received");
        console.log(data["feed"]);
        connection.getListenerHandler(data["feed"]).setRemoteAnswer(data.sdp);
    }
    connectionInfo(connection) {
        console.log("socket:");
        console.log(connection.getSocket());
        console.log("session");
        console.log(connection.getSession());
        connection.getSocket().send(JSON.stringify({ message: "getting connection info" }));
    }
    getFeeds(connection, data) {
        this.janusService.getFeeds(connection, data["room"]);
    }
    publishFeed(connection, data) {
        this.janusService.publishFeed(connection, data);
    }
    trickleIce(connection, data) {
        this.janusService.trickle(connection, data);
    }
    stopRecording(connection, data) {
        this.janusService.stopRecording(connection);
    }
}
exports.SocketController = SocketController;
module.exports.SocketController;
