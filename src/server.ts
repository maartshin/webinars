import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import * as https from "https";
import * as WebSocket from "ws";
import * as fs from "fs";
import * as session from "express-session";
import { mongoose } from "mongoose";
import { SocketController } from "./socket.controller";
import errorHandler = require("errorhandler");
import methodOverride = require("method-override");
import { IModel } from "./models/model";
import { IUserModel, UserSchema } from "./models/user";


export class Server {

    private static readonly PORT: string = "8080";
    private port: string | number;
    private server: https.Server;
    private socket: WebSocket.Server;
    private app: express.Application;
    private static store = new session.MemoryStore();
    private model:IModel;

    public static bootstrap():Server{
        return new Server();
    }

    constructor() {
        this.app = express();
        this.config();
        this.createServer();
        this.sockets();
        this.listen();
        this.addErrorHandler();
    }

    private config() {
        const MONGODB_CONNECTION: string = "mongodb://localhost:27017/heros";

        //add static paths
        this.app.use(express.static(path.join(__dirname, "public")));

        //configure pug
        this.app.set("views", path.join(__dirname, "views"));
        this.app.set("view engine", "pug");
        
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

        //catch 404 and forward to error handler
        this.app.use(function(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
            err.status = 404;
            next(err);
        });

        this.app.use(session({
            store: Server.store,
            secret: "secret",
            key: "sid",
            // cookie: {}
        }));

         //use q promises
        // global.Promise = require("q").Promise;
        // mongoose.Promise = global.Promise;
        
        // connect to mongoose
        let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);

        // create models
        this.model.user = connection.model<IUserModel>("User", UserSchema);

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