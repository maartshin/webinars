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
const mongoose = require("mongoose");
const socket_controller_1 = require("./socket.controller");
const errorHandler = require("errorhandler");
const methodOverride = require("method-override");
const authentication_srv_1 = require("./services/authentication.srv");
const testRouter = require("./routes/test.router");
const userRouter = require("./routes/user.router");
const passport = require("passport");
const util = require("util");
require('dotenv').config();
class Server {
    constructor() {
        this.app = express();
        this.config();
        this.createServer();
        this.sockets();
        this.configureRoutes();
        this.listen();
        this.addErrorHandler();
    }
    static bootstrap() {
        return new Server();
    }
    config() {
        let db = process.env.DB_NAME;
        let port = process.env.DB_PORT;
        let host = process.env.DB_HOST;
        const MONGODB_CONNECTION = util.format("mongodb://%s:%s/%s", host, port, db);
        this.app.use(express.static(path.join(__dirname, "public")));
        this.app.use(logger("dev"));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));
        this.app.use(cookieParser());
        this.app.use(methodOverride());
        passport.use(authentication_srv_1.AuthenticationService.createStrategy());
        passport.use(authentication_srv_1.AuthenticationService.createJWTStrategy());
        this.app.use(passport.initialize());
        this.app.use(passport.session());
        this.app.use(function (err, req, res, next) {
            err.status = 404;
            next(err);
        });
        mongoose.connect(MONGODB_CONNECTION);
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
    configureRoutes() {
        this.app.use("/test", testRouter);
        this.app.use("/user", userRouter);
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
exports.Server = Server;
