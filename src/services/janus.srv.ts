// module._cache[require.resolve('janus-videoroom-client')].exports = require('jws-jwk').shim();
import { Janus } from "janus-videoroom-client";
import { Connection } from "../models/connection";
import { exec } from "child_process";
import * as util from "util";
import { injectable } from "inversify";
import { Capture } from "../models/capture";
import { Stream } from "../models/stream";
// import { Schema } from "mongoose";

@injectable()
export class JanusService{
    janusClient:any;
    
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
                this.addCaptureToDatabase(connection, result.room, options);
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
                this.addStreamToDatabase(connection, room, publisherHandle.getPublisherId());
                connection.getSocket().send(JSON.stringify({event: "onanswer", sdp: answerSdp, stream:stream }));

            });
        });
    }

    private addCaptureToDatabase(connection, room, options){
        let model={
            title: options.description,
            finished: null,
            videoroom: room,
            streams:[],
            record: options.record
        }
        let capture = new Capture(model);
        capture.save().then((capture) => {
            console.log(capture);
        });
        // capture._id;
    }

    private addStreamToDatabase(connection, room, feed){
        let stream = new Stream({
            feed: feed
        });
        console.log("adding stream to database");
        console.log(stream);
        console.log(room);
        stream.save().then((stream) => {
            Capture.findOne({ videoroom: room }).then((capture, err) => {
                if(err){
                    console.log(err);
                    return;
                }
                console.log(capture);
                capture.streams.push(stream._id);
                capture.save();
            });
        });
    }

    private getRoom(videoRoomHandle, room){
        return videoRoomHandle.list().then( (result) => {
            let room = result.list.find((element) => element["room"] === videoRoomHandle.getRoom() );
            return room;
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
        let promises = [];

        for(let handle of connection.getPublisherHandles()){
            let feed = handle.getPublisherId();
            let room = handle.getRoom();
            
            let promise = handle.configure({
                record:false
            }).then(() => {
                console.log("recording stopped");
                let name = this.generateVideoName(room, feed)+"-video";
                console.log(name);
                return this.processVideo(name, room, feed);
            });

            promises.push(promise);
            // break;
        }
        Promise.all(promises).then(()=>{
            console.log("all videos processed");
        });
    }

    public processVideo(name, room, feed){
        let recDir = process.env.REC_DIR;
        let bin = process.env.REC_TOOL_PATH;
        let fileName = this.generateProcessedVideoName(name, "vp8");
        let raw = name+".mjr";
        let cmd = util.format("%s %s %s",bin, recDir+raw, recDir+fileName);
        this.endCapture(room);
        console.log(cmd);
        
        return new Promise((resolve, reject) => {
            exec(cmd, (err, stdout, stderr) => {
                if(err){
                    console.log(err);
                    reject();
                    return;
                }
                console.log(stdout);
                console.log("Post-processing done");
                console.log("should update db");
                this.updateStreamProcessedStatus(feed, fileName);
                resolve();
            });
        });
    }

    private endCapture(room){
        Capture.findOne({ videoroom: room }).then((capture, err) => {
            if(err){
                console.log(err);
                return;
            }
            capture.finished = new Date();
            capture.save();
        });
    }

    private updateStreamProcessedStatus(feed, filename){
        Stream.findOne({feed: feed}).then((stream, err) => {
            if(err){
                console.log(err);
                return;
            }
            stream.filename = filename;
            stream.processed = true;
            stream.save();
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