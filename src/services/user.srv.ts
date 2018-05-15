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

    public login(reqBody){
        console.log(reqBody);
        return User.findOne({ email: reqBody.email }).then((user, err) => {
            // if (err) { return done(err); }
            console.log(user);
            if(!user || !AuthenticationService.isValidPassword(user.password, reqBody.password)){
                return { message: "Wrong username or password", success: false};
            }

            let token = this.authenticationService.createToken(user);
            return { token: token, success: true };
        });
    }

}