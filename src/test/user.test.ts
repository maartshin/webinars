import { suite, test } from "mocha-typescript";
import { IUser, IUserModel, UserSchema } from "../models/user";
import mongoose = require("mongoose");
import * as bcrypt from "bcrypt";

@suite
class UserTest{

    private data: IUser;

    public static User: mongoose.Model<IUserModel>;

    public static before(){

        const MONGODB_CONNECTION: string = "mongodb://localhost:27017/WEBINARS";
        let connection: mongoose.Connection = mongoose.createConnection(MONGODB_CONNECTION);
        UserTest.User = connection.model<IUserModel>("User", UserSchema);


        let chai = require("chai");
        chai.should();
    }

    constructor(){
        this.data = {
            email:"peeter2@pakiraam.ee",
            username:"peeter2",
            password:"pakiraam",
        }
    }

    @test("should create a new User")
    public create() {
        //code that returns a Promise object

        return new UserTest.User(this.data).save().then(result => {
            result._id.should.exist;
            result.email.should.equal(this.data.email);
            result.username.should.equal(this.data.username);

            bcrypt.compare(this.data.password, result.password, (err, res) => {
                res.should.equal(true);
            });
        });
    }

}