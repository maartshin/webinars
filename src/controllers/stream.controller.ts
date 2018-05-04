import {
    controller, httpGet, httpPost, httpPut, httpDelete, response, request, requestParam
} from 'inversify-express-utils';
import { inject } from 'inversify';
import { Request, Response } from "express";
import { StreamService } from '../services/stream.srv';
import TYPES from '../constant/types';

@controller("/api")
export class StreamController{

    @inject(TYPES.StreamService)
    private streamService: StreamService;

    @httpGet("/stream/:feed")
    public getMessage(@requestParam("feed") feed:string,
                        @request() req: Request, @response() res: Response){
        console.log(feed);
        return this.streamService.getStreamFilename(feed).then((filename) => {
            console.log(filename);
            this.streamService.getStream(filename, req, res);
            return { message: "should start stream"};
        })
    }

    @httpGet("/recordings")
    public getRecordings(@request() req: Request, @response() res: Response){
        let recordings = this.streamService.getRecordings();
        res.setHeader('Content-Type', 'application/json');
        return recordings;
    }

    @httpGet("/streams/:id")
    public getRecordedStreams(@requestParam("id") id: string){
        return this.streamService.getRecordedStreams(id);
    }

}