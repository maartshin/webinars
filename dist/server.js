"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const logger = require("morgan");
const path = require("path");
const https = require("https");
const WebSocket = require("ws");
const fs = require("fs");
const session = require("express-session");
const mongoose_1 = require("mongoose");
const socket_controller_1 = require("./socket.controller");
const errorHandler = require("errorhandler");
const methodOverride = require("method-override");
const user_1 = require("./models/user");
class Server {
    constructor() {
        this.app = express();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
        this.addErrorHandler();
    }
    static bootstrap() {
        return new Server();
    }
    config() {
        const MONGODB_CONNECTION = "mongodb://localhost:27017/heros";
        this.app.use(express.static(path.join(__dirname, "public")));
        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "pug");
        this.app.use(logger("dev"));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.app.use(cookieParser());
        this.app.use(methodOverride());
        this.app.use(function (err, req, res, next) {
            err.status = 404;
            next(err);
        });
        this.app.use(session({
            store: Server.store,
            secret: "secret",
            key: "sid",
        }));
        let connection = mongoose_1.mongoose.createConnection(MONGODB_CONNECTION);
        this.model.user = connection.model("User", user_1.UserSchema);
        this.app.use(errorHandler());
        this.port = Server.PORT;
        this.app.set("port", this.port);
    }
    createServer() {
        let privateKey = fs.readFileSync(__dirname + '/../ssl/privateKey.key');
        let certificate = fs.readFileSync(__dirname + '/../ssl/certificate.crt');
        this.server = https.createServer({
            key: privateKey,
            cert: certificate
        }, this.app);
    }
    sockets() {
        this.socket = new WebSocket.Server({ server: this.server, path: "/socket" });
        this.socket.on('connection', socket_controller_1.SocketController.init);
    }
    listen() {
        console.log("listen");
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });
    }
    getApp() {
        return this.app;
    }
    static getStore() {
        return Server.store;
    }
    addErrorHandler() {
        this.server.on("error", (error) => {
            if (error.syscall !== "listen") {
                throw error;
            }
            var bind = typeof this.port === "string"
                ? "Pipe " + this.port
                : "Port " + this.port;
            switch (error.code) {
                case "EACCES":
                    console.error(bind + " requires elevated privileges");
                    process.exit(1);
                    break;
                case "EADDRINUSE":
                    console.error(bind + " is already in use");
                    process.exit(1);
                    break;
                default:
                    throw error;
            }
        });
    }
}
Server.PORT = "8080";
Server.store = new session.MemoryStore();
exports.Server = Server;
