import { Document, Schema, Model, model} from "mongoose";

export interface ICaptureModel extends ICapture, Document {
    
}

export interface ICapture{
    title: string;
    finished: Date;
    videoroom: string;
    streams:any[];
    record: Boolean;
}

export var CaptureSchema: Schema = new Schema({
    title:{
        type: String,
        unique: false,
        required: true,
        trim: true
    },
    finished:{
        type: Date,
        required: false
    },
    videoroom:{
        type: String,
        unique: true,
        required: true
    },
    record: {
        type: Boolean,
        default: false
    },
    streams: [{ type: Schema.Types.ObjectId, ref: 'Stream' }],
});


CaptureSchema.pre("save", function(next) {
    let now = new Date();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    next();
});

export const Capture: Model<ICaptureModel> = model<ICaptureModel>("Capture", CaptureSchema);


