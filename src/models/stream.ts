import { Document, Schema, Model, model} from "mongoose";

export interface IStreamModel extends IStream, Document {
    
}

export interface IStream{
    feed: string;
    processed: boolean;
    audioProcessed: boolean;
    filename: string;
    raw:string;
}

export var StreamSchema: Schema = new Schema({
    feed:{
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    processed: {
        type: Boolean,
        required: false,
        default: false
    },
    audioProcessed: {
        type: Boolean,
        required: false,
        default: false
    },
    raw:{
        type: String,
        unique: false,
        required: false,
        trim: true,
        default: ""
    },
    filename:{
        type: String,
        unique: false,
        required: false,
        trim: true,
        default: ""
    }
});


StreamSchema.pre("save", function(next) {
    let now = new Date();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    next();
});

export const Stream: Model<IStreamModel> = model<IStreamModel>("Stream", StreamSchema);


