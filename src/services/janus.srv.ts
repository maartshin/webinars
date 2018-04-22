// module._cache[require.resolve('janus-videoroom-client')].exports = require('jws-jwk').shim();
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

    public createRoom(connection: Connection, options){
        let session = connection.getSession();
        console.log(options);
        console.log(util.format("rec_dir: %s", process.env.REC_DIR));
        session.videoRoom().defaultHandle().then((videoRoomHandle) => {
            console.log(process.cwd());
            videoRoomHandle.create({
                publishers: 2,
                is_private: options.publish ? false : true,
                audiocodec: 'opus',
                videocodec: 'vp8',
                description: options.description,
                // record: options.record ? true : false,
                rec_dir: process.env.REC_DIR
            }).then((result) => {
                console.log(result.room);
                connection.getSocket().send(JSON.stringify({ event: "created", room: result.room }));
            });
        });
    }

    public publishFeed(connection: Connection, data){
        let room = data["room"];
        let offerSdp = data["sdp"]
        let options = data["options"];
        let stream = data["stream"];

        connection.getSession().videoRoom().publishFeed(room, offerSdp).then((publisherHandle) => {
            connection.addPublisherHandler(publisherHandle);
            var answerSdp = publisherHandle.getAnswer();
            console.log(answerSdp);
            
            let filename = this.generateVideoName(publisherHandle.getRoom(), publisherHandle.getPublisherId());
            console.log(filename);
            publisherHandle.configure({
                filename: filename,
                record:options["record"] ? true : false
            }).then((res)=>{
                console.log(res);
                connection.getSocket().send(JSON.stringify({event: "onanswer", sdp: answerSdp, stream:stream }));
            });
        });
    }

    public listenFeed(connection: Connection, feed, videoRoom){
        console.log("going to listen to feed");
        console.log(feed);
        console.log(videoRoom);
        connection.getSession().videoRoom().listenFeed(videoRoom, feed).then((listenerHandle) => {
            var offerSdp = listenerHandle.getOffer();
            console.log("listening feed");
            connection.addListenerHandle(listenerHandle, feed);
            connection.getSocket().send(JSON.stringify({event: "onoffer", sdp:{sdp:offerSdp, type: "offer"}, feed:feed }));
            console.log("offer sent");
        }).catch((error) => {
            console.log("error listening to feed:" + feed);
            console.log(error);
        });
    }

    public getFeeds(connection: Connection, videoRoom){
        connection.getSession().videoRoom().getFeeds(videoRoom).then((feeds) => {
            console.log(feeds);
            for(let feed of feeds){
                this.listenFeed(connection, feed, videoRoom);
            }
        });
    }

    public trickle(connection, data){
        if(!data["publisher"]){
            connection.getListenerHandler(data["feed"]).trickle(data.candidate).then(()=> {
                console.log("trickle for: "+data["feed"]);
            });
            return;
        }

        for(let handle of connection.getPublisherHandles()){
            handle.trickle(data.candidate).then(() => {
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
    }

    public processVideo(name){
        let recDir = process.env.REC_DIR;
        let bin = process.env.REC_TOOL_PATH;
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