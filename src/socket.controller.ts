import * as WebSocket from "ws";
import { JanusService } from "./services/janus.srv";
import * as cookieParser from "cookie-parser";
import { Server } from "./server";
import { Connection } from "./models/connection";
import { EventEmitter } from "events";

export class SocketController{

    // @inject(TYPES.JanusService)
    // private janusService: JanusService;

    janusService:JanusService = new JanusService();
    socket: any;
    sessions = {};
    connections: Connection[] = [];
    eventEmitter:EventEmitter = new EventEmitter();

    private constructor(){
       this.addEventListeners();
    }

    public static init(ws: WebSocket, req){
        // console.log(req);
        let controller = new SocketController();
        // controller.addSession(req);
        // controller.setSocket(ws);
        
        let connection = controller.addConnection(ws);
        controller.addEvents(connection);
    }

    private addConnection(ws){
        let connection: Connection = new Connection(ws);
        this.janusService.connect(connection);
        this.connections.push(connection);
        console.log("adding connection");
        console.log(connection.getSession());
        return connection;
    }

    private addSession(req){
        console.log("Adding session");
        // console.log(req);
        cookieParser()(req, null, (err) => {
            console.log("parsing cookie");
            var sessionID = req.signedCookies;
            console.log(req.session);
            console.log(sessionID);
        });
    }

    private addEvents(connection: Connection){
        let ws = connection.getSocket();
        ws.on("message", (message: string) => {
            let data;
            try{
                data = JSON.parse(message);
            }catch(e){
                ws.send(JSON.stringify({ error: "Not a json object." }));
                return;
            }
            this.invokeEvent(connection, data);
            // this.eventEmitter.emit(data["event"], connection, data);
        });

        ws.on("close", () => {
            this.janusService.stopStreaming(connection).then(() => {
                connection.getSession().destroy().then(()=>{
                    console.log("Janus Gateway session destroyed");
                });
            });
        });
    }

    private addEventListeners(){
        this.eventEmitter.on("new", this.createRoom);
        this.eventEmitter.on("connection", this.connectionInfo);
        this.eventEmitter.on("publish", this.publishFeed);
        this.eventEmitter.on("feeds", this.getFeeds);
        this.eventEmitter.on("ice", this.trickleIce);
        this.eventEmitter.on("onanswer", this.onAnswer);
        this.eventEmitter.on("rooms", this.getRooms);
        this.eventEmitter.on("stopstreaming", this.stopStreaming);
    }

    private invokeEvent(connection, data){
        let ws = connection.getSocket();
        switch(data["event"]){
            case "new": this.createRoom(connection, data);
                break;
            case "connection": this.connectionInfo(connection);
                break;
            case "publish": this.publishFeed(connection, data);
                break;
            case "feeds": this.getFeeds(connection, data);
                break;
            case "ice": this.trickleIce(connection, data);
                break;
            case "onanswer": this.onAnswer(connection, data);
                break;
            case "rooms" : this.getRooms(connection, data);
                break;
            case "stopstreaming": this.stopStreaming(connection, data);
                break;
            default:
                ws.send(JSON.stringify({ event: "error",  error: "Unknown event"}));
                break;
        }
    }

    private getRooms(connection, data){
        console.log("getting rooms");
        this.janusService.getRooms(connection);
    }

    private connectToJanus(ws){
        this.socket.send(JSON.stringify({message: "Connected to janus"}));
    }

    private createRoom(connection, data){
        console.log("creating room");
        console.log(data);
        this.janusService.createRoom(connection, data.options);
    }

    private onAnswer(connection, data){
        console.log("answer received");
        console.log(data["feed"]);
        connection.getListenerHandler(data["feed"]).setRemoteAnswer(data.sdp);
    }

    private connectionInfo(connection){
        console.log("socket:");
        console.log(connection.getSocket());
        console.log("session");
        console.log(connection.getSession());
        connection.getSocket().send(JSON.stringify({message: "getting connection info"}));
    }

    private getFeeds(connection, data){
        this.janusService.getFeeds(connection, data["room"]);
    }

    private publishFeed(connection, data){
        this.janusService.publishFeed(connection, data);
    }

    private trickleIce(connection, data){
        this.janusService.trickle(connection, data);
    }

    private stopStreaming(connection, data){
        this.janusService.stopStreaming(connection);
    }
}

module.exports.SocketController