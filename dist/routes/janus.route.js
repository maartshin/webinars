"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
class JanusRoute {
    constructor() {
        this.router = express_1.Router();
        this.init();
    }
    getAll(req, res, next) {
        res.send("Hello world");
    }
    init() {
        this.router.get('/', this.getAll);
    }
}
exports.JanusRoute = JanusRoute;
