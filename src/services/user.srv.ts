import { IUserModel, User } from "../models/user";
import mongoose = require("mongoose");
import { Server } from "../server";
import passport = require("passport");
import { AuthenticationService } from "../services/authentication.srv";

// passport.use(AuthenticationService.createStrategy());

export class UserService{

    public static register(user: IUserModel): Promise<any>{
        return new User(user).save();
    }

    public static login(req, res){
        console.log("logging in");
        passport.authenticate("local", (err, user, info) => {
            // If Passport throws/catches an error
            if (err) {
                console.log("error");
                console.log(err);
                res.status(404).json(err);
                return;
            }

            // If a user is found
            if(user){
                res.status(200);
                res.json({
                    "token" : "bearer "+AuthenticationService.createToken(user)
                });
            } else {
                res.status(401).json(info);
            }   
        })(req, res);
    }

}