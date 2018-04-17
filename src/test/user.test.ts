import { suite, test } from "mocha-typescript";
import { IUser, IUserModel, UserSchema } from "../models/user";
import mongoose = require("mongoose");

@suite
class UserTest{

    @test("should create a new User")
    public create() {
        //code that returns a Promise object
    }

}