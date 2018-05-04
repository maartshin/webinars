"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const bcrypt = require("bcrypt");
exports.UserSchema = new mongoose_1.Schema({
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
    captures: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Capture' }]
});
exports.UserSchema.pre("save", function (next) {
    let now = new Date();
    if (!this.createdAt) {
        this.createdAt = now;
    }
    bcrypt.hash(this.password, 10, (err, hash) => {
        if (err) {
            return next(err);
        }
        this.password = hash;
        next();
    });
});
exports.UserSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};
exports.User = mongoose_1.model("User", exports.UserSchema);
