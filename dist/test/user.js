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
