"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const user_1 = require("../models/user");
const mongoose = require("mongoose");
require("mocha");
const MONGODB_CONNECTION = "mongodb://localhost:27017/WEBINARS";
let connection = mongoose.createConnection(MONGODB_CONNECTION);
var User = connection.model("User", user_1.UserSchema);
let chai = require("chai");
chai.should();
describe("User", function () {
    describe("create()", function () {
        it("should create a new User", function () {
            let user = {
                email: "peeter@pakiraam.ee",
                username: "peeter",
                password: "pakiraam",
                passwordConf: "pakiraam"
            };
            return new User(user).save().then(result => {
                result._id.should.exist;
                result.email.should.equal(user.email);
                result.username.should.equal(user.username);
                result.password.should.equal(user.password);
                result.passwordConf.should.equal(user.passwordConf);
            });
        });
    });
});
