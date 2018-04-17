import { Document, Schema, Model, model} from "mongoose";

export interface IUserModel extends IUser, Document {
    
}


export interface IUser{
    email:string;
    username:string;
    password:string;
    passwordConf:string;
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
    passwordConf: {
        type: String,
        required: true
    }
});

UserSchema.pre("save", function(next) {
    let now = new Date();
    if (!this.createdAt) {
      this.createdAt = now;
    }
    next();
});

export const User: Model<IUserModel> = model<IUserModel>("User", UserSchema);





//http://brianflove.com/2016/10/04/typescript-declaring-mongoose-schema-model/