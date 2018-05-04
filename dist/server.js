"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const logger = require("morgan");
const path = require("path");
const https = require("https");
const WebSocket = require("ws");
const fs = require("fs");
const inversify_1 = require("inversify");
const inversify_express_utils_1 = require("inversify-express-utils");
const mongoose = require("mongoose");
const socket_controller_1 = require("./socket.controller");
const errorHandler = require("errorhandler");
const methodOverride = require("method-override");
const authentication_srv_1 = require("./services/authentication.srv");
const passport = require("passport");
const util = require("util");
const user_srv_1 = require("./services/user.srv");
const janus_srv_1 = require("./services/janus.srv");
const types_1 = require("./constant/types");
require("./controllers/user.controller");
require("./controllers/stream.controller");
const stream_srv_1 = require("./services/stream.srv");
require('dotenv').config();
class Server {
    constructor() {
        let container = this.loadContainer();
        let server = new inversify_express_utils_1.InversifyExpressServer(container);
        server.setConfig(this.config);
        let app = server.build();
        this.createServer(app);
        this.sockets();
        this.listen();
    }
    static bootstrap() {
        return new Server();
    }
    config(app) {
        let db = process.env.DB_NAME;
        let port = process.env.DB_PORT;
        let host = process.env.DB_HOST;
        const MONGODB_CONNECTION = util.format("mongodb://%s:%s/%s", host, port, db);
        app.use(express.static(path.join(__dirname, "public")));
        app.use(logger("dev"));
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        app.use(cookieParser());
        app.use(methodOverride());
        passport.use(authentication_srv_1.AuthenticationService.createStrategy());
        passport.use(authentication_srv_1.AuthenticationService.createJWTStrategy());
        app.use(passport.initialize());
        app.use(passport.session());
        app.use(function (err, req, res, next) {
            err.status = 404;
            next(err);
        });
        mongoose.connect(MONGODB_CONNECTION);
        app.use(errorHandler());
        app.set("port", Server.PORT);
    }
    loadContainer() {
        let container = new inversify_1.Container();
        container.bind(types_1.default.UserService).to(user_srv_1.UserService);
        container.bind(types_1.default.AuthenticationService).to(authentication_srv_1.AuthenticationService);
        container.bind(types_1.default.JanusService).to(janus_srv_1.JanusService);
        container.bind(types_1.default.StreamService).to(stream_srv_1.StreamService);
        return container;
    }
    createServer(app) {
        let privateKey = fs.readFileSync(__dirname + '/../ssl/privateKey.key');
        let certificate = fs.readFileSync(__dirname + '/../ssl/certificate.crt');
        this.server = https.createServer({
            key: privateKey,
            cert: certificate
        }, app);
    }
    sockets() {
        this.socket = new WebSocket.Server({ server: this.server, path: "/socket" });
        this.socket.on('connection', socket_controller_1.SocketController.init);
    }
    listen() {
        console.log("listen");
        this.server.listen(Server.PORT, () => {
            console.log('Running server on port %s', Server.PORT);
        });
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
