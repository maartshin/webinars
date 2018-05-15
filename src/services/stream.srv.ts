import { injectable } from "inversify";
import * as util from "util";
import * as fs from "fs";
import { Capture } from "../models/capture";
import { Stream } from "../models/stream";

@injectable()
export class StreamService{
    private readonly recDir:string = process.env.REC_DIR;

    public getStream(filename, req, res){
        let path = util.format("%s/%s", this.recDir, filename);
        console.log(path);
        let stat = fs.statSync(path);
        let fileSize = stat.size;
        let range = req.headers.range;

        if(range) {
            let parts = range.replace(/bytes=/, "").split("-")
            let start = parseInt(parts[0], 10)
            let end = parts[1]
            ? parseInt(parts[1], 10)
            : fileSize-1

            let chunksize = (end-start)+1
            let file = fs.createReadStream(path, {start, end})
            let head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/webm',
            }
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            let head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/webm',
            }
            res.writeHead(200, head)
            fs.createReadStream(path).pipe(res)
        }
    }

    public getStreamFilename(feed){
        return Stream.findOne({ feed: feed }).then((stream, err) => {
            if(err){
                console.log(err);
                return;
            }
            return stream.filename;
        })
    }

    public getRecordings(){
        return Capture.find({ record: true });
    }

    public getRecordedStreams(roomId){
        return Capture.findOne({ videoroom: roomId }).populate("streams").then(capture => {
            console.log(capture);
            return capture.streams.filter(stream => stream.processed).map(stream => stream.feed);
        })
    }
}