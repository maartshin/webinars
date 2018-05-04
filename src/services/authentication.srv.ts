import { UserSchema, IUserModel, User} from "../models/user";
import * as bcrypt from "bcrypt";
import { Strategy } from "passport-local";
import jwt = require('jsonwebtoken');
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import { injectable } from "inversify";

@injectable()
export class AuthenticationService{
    
    public static createStrategy(){
        return new Strategy({ usernameField : "username" }, (username, password, done) => {
            User.findOne({ username: username }).then((user, err) => {
                if (err) { return done(err); }
                if (!user) {
                    return done(null, false, {
                        message: 'User not found'
                    });
                }

                if(!this.isValidPassword(user.password, password)){
                    return done(null, false, {
                        message: 'Password is wrong'
                    });
                }
                // If credentials are correct, return the user object
                return done(null, user);
            });
        });
    }

    public createToken(user){
        var expiry: Date = new Date();
        expiry.setDate(expiry.getDate() + 7);
        console.log(user._id);
        return jwt.sign({
            _id: user._id,
            email: user.email,
            username: user.name,
            exp: expiry.getTime() / 1000,
        }, process.env.JWT_SECRET);
    }

    private static isValidPassword(hash, password){
        return bcrypt.compareSync(password, hash);
    }

    public static createJWTStrategy(){
        console.log(process.env.JWT_SECRET);
        return new JWTStrategy({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey   : process.env.JWT_SECRET
        }, this.getUserFromDatabase);
    }

    private static getUserFromDatabase(jwtPayload, cb){
        return User.findById(jwtPayload._id).then(user => {
            return cb(null, user);
        }).catch(err => {
            return cb(err);
        });
    }
}