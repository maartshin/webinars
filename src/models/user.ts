import { Document, Schema, Model, model} from "mongoose";
import * as bcrypt from "bcrypt";
import { AuthenticationService } from "../services/authentication.srv";
import { ICaptureModel } from "./capture";

export interface IUserModel extends IUser, Document {
    
}


export interface IUser{
    email:string;
    username:string;
    password:string;
    captures: ICaptureModel[];
}

export var UserSchema: Schema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    captures: [{ type: Schema.Types.ObjectId, ref: 'Capture' }]
});

UserSchema.pre("save", function(next) {
    let now = new Date();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    bcrypt.hash(this.password, 10, (err, hash) => {
        if(err){
            return next(err);
        }
        this.password = hash;
        next();
    });
});

// UserSchema.methods.generateJwT = function(){
//     console.log("generating token");
    
// }

UserSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
}

export const User: Model<IUserModel> = model<IUserModel>("User", UserSchema);





//http://brianflove.com/2016/10/04/typescript-declaring-mongoose-schema-model/