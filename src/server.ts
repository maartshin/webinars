import "reflect-metadata";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import * as https from "https";
import * as WebSocket from "ws";
import * as fs from "fs";
import * as session from "express-session";
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import mongoose = require("mongoose");
import { SocketController } from "./socket.controller";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import { AuthenticationService } from "./services/authentication.srv";
import * as passport from "passport";
import * as util from "util";
import { UserService } from "./services/user.srv";
import { JanusService } from "./services/janus.srv";
import TYPES from './constant/types';
import './controllers/user.controller';
import './controllers/stream.controller';
import { StreamService } from "./services/stream.srv";
require('dotenv').config();

export class Server {

    private static readonly PORT: string = "8080";
    private port: string | number;
    private server: https.Server;
    private socket: WebSocket.Server;

    public static bootstrap():Server{
        return new Server();
    }

    constructor() {
        let container = this.loadContainer();
        let server = new InversifyExpressServer(container);
        server.setConfig(this.config);
        let app = server.build();
        this.createServer(app);
        // this.configureRoutes(app);
        this.sockets();
        this.listen();
        // serverInstance.listen(this.port, );
        // let app = express();
        // this.config(app);
        // this.createServer(app);
        // this.sockets();
        // this.configureRoutes(app);
        // this.listen();
        // this.addErrorHandler();
    }

    private config(app) {
        let db = process.env.DB_NAME;
        let port = process.env.DB_PORT;
        let host = process.env.DB_HOST;

        const MONGODB_CONNECTION: string = util.format("mongodb://%s:%s/%s", host, port, db);

        //add static paths
        app.use(express.static(path.join(__dirname, "public")));

        //use logger middlware
        app.use(logger("dev"));

        //use json form parser middlware
        app.use(bodyParser.json());

        //use query string parser middlware
        app.use(bodyParser.urlencoded({
            extended: true
        }));

        //use cookie parser middleware
        // this.app.use(cookieParser("SECRET_GOES_HERE"));
        app.use(cookieParser());

        //use override middlware
        app.use(methodOverride());

        passport.use(AuthenticationService.createJWTStrategy());

        app.use(passport.initialize());
        app.use(passport.session());

        //catch 404 and forward to error handler
        app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404;
            next(err);
        });

        // connect to mongoose
        mongoose.connect(MONGODB_CONNECTION)

        //error handling
        app.use(errorHandler());

        // this.port = Server.PORT;
        app.set("port", Server.PORT);
    }

    private loadContainer(){
        let container = new Container();
        container.bind<UserService>(TYPES.UserService).to(UserService);
        container.bind<AuthenticationService>(TYPES.AuthenticationService).to(AuthenticationService);
        container.bind<JanusService>(TYPES.JanusService).to(JanusService);
        container.bind<StreamService>(TYPES.StreamService).to(StreamService);
        return container;
    }

    private createServer(app){
        let privateKey = fs.readFileSync(__dirname + '/../ssl/privateKey.key');
        let certificate = fs.readFileSync(__dirname + '/../ssl/certificate.crt');
        this.server = https.createServer({
            key: privateKey,
	        cert: certificate
        }, app);
    }

    private sockets(){
        this.socket = new WebSocket.Server({server: this.server, path: "/socket"});
        this.socket.on('connection', SocketController.init);
    }

    private listen(): void{
        console.log("listen");
        this.server.listen(Server.PORT, () => {
            console.log('Running server on port %s', Server.PORT);
        });
    }

    private addErrorHandler(){
        this.server.on("error", (error:any) => {
            if (error.syscall !== "listen") {
                throw error;
              }
            
              var bind = typeof this.port === "string"
                ? "Pipe " + this.port
                : "Port " + this.port;
            
              // handle specific listen errors with friendly messages
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