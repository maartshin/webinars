import { IUserModel, User } from "../models/user";
import mongoose = require("mongoose");
import { Server } from "../server";
import passport = require("passport");
import { inject } from "inversify";
import TYPES from "../constant/types";
import { AuthenticationService } from "../services/authentication.srv";
import { injectable } from 'inversify';

@injectable()
export class UserService{

    @inject(TYPES.AuthenticationService)
    private authenticationService: AuthenticationService;

    public register(user: IUserModel): Promise<any>{
        return new User(user).save();
    }

    public login(req, res){
        console.log("logging in");
        return passport.authenticate("local", (err, user, info) => {
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
                    "token" : "bearer " + this.authenticationService.createToken(user)
                });
            } else {
                res.status(401).json(info);
            }   
        })(req, res);
    }

}