import { IUserModel, UserSchema, IUser } from "../models/user";
import mongoose = require("mongoose");
import "mocha";


const MONGODB_CONNECTION: string = "mongodb://localhost:27017/WEBINARS";
let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);
var User: mongoose.Model<IUserModel> = connection.model<IUserModel>("User", UserSchema);

let chai = require("chai");
chai.should();

describe("User", function(){
    describe("create()", function () {
        it("should create a new User", function () {
            //user object
            let user: IUser = {
                email:"peeter@pakiraam.ee",
                username:"peeter",
                password:"pakiraam",
                passwordConf:"pakiraam"
            };
      
            //create user and return promise
            return new User(user).save().then(result => {
              //verify _id property exists
              result._id.should.exist;
              result.email.should.equal(user.email);
              result.username.should.equal(user.username);
              result.password.should.equal(user.password);
              result.passwordConf.should.equal(user.passwordConf)
            });
        });
    })
});

