import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import * as https from "https";
import * as WebSocket from "ws";
import * as fs from "fs";
import * as session from "express-session";
import mongoose = require("mongoose");
import { SocketController } from "./socket.controller";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import { AuthenticationService } from "./services/authentication.srv";
import testRouter = require("./routes/test.router");
import userRouter = require("./routes/user.router");
import * as passport from "passport";
import * as util from "util";
require('dotenv').config();

export class Server {

    private static readonly PORT: string = "8080";
    private port: string | number;
    private server: https.Server;
    private socket: WebSocket.Server;
    private app: express.Application;
    private static store = new session.MemoryStore();

    public static bootstrap():Server{
        return new Server();
    }

    constructor() {
        this.app = express();
        this.config();
        this.createServer();
        this.sockets();
        this.configureRoutes();
        this.listen();
        this.addErrorHandler();
    }

    private config() {
        let db = process.env.DB_NAME;
        let port = process.env.DB_PORT;
        let host = process.env.DB_HOST;

        const MONGODB_CONNECTION: string = util.format("mongodb://%s:%s/%s", host, port, db);

        //add static paths
        this.app.use(express.static(path.join(__dirname, "public")));

        //use logger middlware
        this.app.use(logger("dev"));

        //use json form parser middlware
        this.app.use(bodyParser.json());

        //use query string parser middlware
        this.app.use(bodyParser.urlencoded({
            extended: true
        }));

        //use cookie parser middleware
        // this.app.use(cookieParser("SECRET_GOES_HERE"));
        this.app.use(cookieParser());

        //use override middlware
        this.app.use(methodOverride());

        passport.use(AuthenticationService.createStrategy());
        passport.use(AuthenticationService.createJWTStrategy());

        this.app.use(passport.initialize());
        this.app.use(passport.session());

        //catch 404 and forward to error handler
        this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404;
            next(err);
        });

        // this.app.use(session({
        //     store: Server.store,
        //     secret: "secret",
        //     resave: true,
        //     saveUninitialized: false
        // }));

        // connect to mongoose
        mongoose.connect(MONGODB_CONNECTION)

        //error handling
        this.app.use(errorHandler());

        this.port = Server.PORT;
        this.app.set("port", this.port);
        
    }

    private createServer(){
        let privateKey = fs.readFileSync(__dirname + '/../ssl/privateKey.key');
        let certificate = fs.readFileSync(__dirname + '/../ssl/certificate.crt');
        this.server = https.createServer({
            key: privateKey,
	        cert: certificate
        }, this.app);
    }

    private sockets(){
        this.socket = new WebSocket.Server({server: this.server, path: "/socket"});
        this.socket.on('connection', SocketController.init);
    }

    private listen(): void{
        console.log("listen");
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port);
        });
    }

    public getApp(){
        return this.app;
    }

    public static getStore(){
        return Server.store;
    }

    private configureRoutes(){
        this.app.use("/test", testRouter);
        this.app.use("/user", userRouter);
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