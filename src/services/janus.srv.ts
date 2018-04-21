import { Janus } from "janus-videoroom-client";
import { Connection } from "../models/connection";
import { exec } from "child_process";
import * as util from "util";

export class JanusService{
    janusClient:any;
    defaultHandle: any;
    publisherHandle:any;
    listenerHandle:any;
    
    constructor(){
        let host = process.env.JANUS_HOST;
        let port = process.env.JANUS_PORT;
        this.janusClient = new Janus({
            url: util.format("wss://%s:%s", host, port)
        });
    }

    public connect(connection: Connection){
        this.janusClient.onConnected(() => {
            console.log("connected");
            this.janusClient.createSession().then((session) => {
                connection.setSession(session);
                console.log("session created");
            });
        });

        this.janusClient.onDisconnected(() => {
            console.log("disconnected");
        });

        this.janusClient.onError((err) => {
            console.log("Error connecting to janus");
            console.log(err);
        });
        
        this.janusClient.connect();
    }

    public createRoom(connection: Connection){
        let session = connection.getSession();
        console.log(session);
        session.videoRoom().defaultHandle().then((videoRoomHandle) => {
            console.log(process.cwd());
            videoRoomHandle.create({
                publishers: 2,
                is_private: false,
                audiocodec: 'opus',
                videocodec: 'vp8',
                record: false,
                rec_dir: 'recordings'
            }).then((result) => {
                console.log(result.room);
                connection.getSocket().send(JSON.stringify({ event: "created", room: result.room }));
            });
        });
    }

    public publishFeed(connection: Connection, room, offerSdp){
        connection.getSession().videoRoom().publishFeed(room, offerSdp).then((publisherHandle) => {
            connection.addPublisherHandler(publisherHandle);
            var answerSdp = publisherHandle.getAnswer();
            console.log(answerSdp);
            connection.getSocket().send(JSON.stringify({event: "onanswer", sdp: answerSdp }));
            let filename = this.generateVideoName(publisherHandle.getRoom(), publisherHandle.getPublisherId());
            console.log(filename);
            publisherHandle.configure({
                filename: filename
            });
        });
    }

    public listenFeed(connection: Connection, feed, videoRoom){
        console.log("going to listen to feed");
        console.log(feed);
        console.log(videoRoom);
        connection.getSession().videoRoom().listenFeed(videoRoom, feed).then((listenerHandle) => {
            console.log("hello");
            var offerSdp = listenerHandle.getOffer();
            console.log("listening feedd");
            connection.addListenerHandle(listenerHandle);
            connection.getSocket().send(JSON.stringify({event: "onoffer", sdp:{sdp:offerSdp, type: "offer"} }));
            console.log("offer sent");
        }).catch((error) => {
            console.log("ervyouyou
            youoojkmngvfcdxsza<adaFASDFASDFASDFASDSDFASDFADSFASDFror listening to feed:" + feed);
            console.log(error);
        });
    }

    public getFeeds(connection: Connection, videoRoom){
        connection.getSession().videoRoom().getFeeds(videoRoom).then((feeds) => {
            console.log(feeds);
            for(let feed of feeds){
                this.listenFeed(connection, feed, videoRoom);
                break;
            }
        });
    }

    public trickle(connection, data){
        for(let publisherHandler of connection.getPublisherHandles()){
            console.log("publisher trickle");
            publisherHandler.trickle(data.candidate).then(() => {
                console.log("trickle completed");
            });
        }

        for(let listenerHandle of connection.getListenerHandlers()){
            console.log("publisher trickle");
            listenerHandle.trickle(data.candidate).then(() => {
                console.log("trickle completed");
            });
        }
    }

    public getRooms(connection){
        connection.getSession().videoRoom().defaultHandle().then((videoRoomHandle) => {
            videoRoomHandle.list().then((list) => {
                let req = { event:"rooms", rooms:list };
                connection.getSocket().send(JSON.stringify(req));
            });
        });
    }

    public record(connection){
        connection.getPublisherHandles()[0].configure({
            record:true
        }).then(() => {
            console.log("recording started");
        });
        // connection.getSession().videoRoom().defaultHandle().then(videoRoomHandle => {
        //     videoRoomHandle.configure({
        //         record:true
        //     }).then(() => {
        //         console.log("recording started");
        //     });
        // });
    }

    public stopRecording(connection){
        console.log("stopping recording");
        console.log(connection.getPublisherHandles());

        for(let handle of connection.getPublisherHandles()){
            let feed = handle.getPublisherId();
            let room = handle.getRoom();
            handle.configure({
                record:false
            }).then(() => {
                console.log("recording stopped");
                let name = this.generateVideoName(room, feed)+"-video";
                console.log(name);
                this.processVideo(name);
            });
            break;
        }
        connection
    }

    public processVideo(name){
        let recDir = "/home/maartshin/recordings/";
        let bin = "/opt/janus/bin/janus-pp-rec"; 
        let cmd = util.format("%s %s %s",bin, recDir+name+".mjr", recDir+this.generateProcessedVideoName(name, "vp8"));
        console.log(cmd);
        exec(cmd, (err, stdout, stderr) => {
            if(err){
                console.log(err);
                return;
            }
            console.log(stdout);
            console.log("Post-processing done");
            console.log("should update db");
        });
    }

    private generateProcessedVideoName(name, format){
        let extension = this.getExtension(format);
        return util.format("%s_processed.%s", name, extension);
    }

    private generateVideoName(room, feed){
        return util.format("%s_%s", room, feed);
    }

    private getExtension(format:string){
        let extension = "";
        switch(format.toLowerCase()){
            case "vp8": extension = "webm";
                break;
            case "opus": extension = "opus";
                break;
            case "h.264": extension = "mp4";
                break;
            case "G.711": extension = "wav";
                break;
            default: extension = "webm";
                break;
        }
        return extension;
    }

}

module.exports.JanusService;