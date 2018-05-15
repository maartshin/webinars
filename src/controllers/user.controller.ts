import {
    controller, httpGet, httpPost, httpPut, httpDelete, response, request
} from 'inversify-express-utils';
import { inject } from 'inversify';
import { Request, Response, NextFunction } from "express";
import { User } from "../models/user";
import { UserService } from "../services/user.srv";
import { AuthenticationService } from "../services/authentication.srv";
import TYPES from '../constant/types';
import passport =  require("passport");

@controller("/api/user")
export class UserController {

    @inject(TYPES.UserService)
    private userService: UserService;

    @inject(TYPES.AuthenticationService)
    private authenticationService: AuthenticationService;

    private authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
        passport.authenticate("jwt", {session:false});
    }

    @httpGet("/")
    public getMessage(){
        return { message:"this is a user router" };
    }

    @httpPost("/register")
    public register(@request() request: Request, @response() response: Response){
        return this.userService.register(request.body).then((user) => {
            let token = this.authenticationService.createToken(user);
            response.status(200);
            return {registration:true, token: token};
        }).catch(err => {
            console.log("registration unsuccessful");
            response.status(400);
            return {registration: false, message: err};
        });
    }

    @httpPost("/login")
    public login(@request() request: Request, @response() response: Response){
        return this.userService.login(request.body).then(res => {
            if(!res["success"]){
                response.status(403);
                return res;
            }
            response.cookie("Authorization", "Bearer " + res["token"]);
            response.status(200);
            return res;
        });
    }

    @httpGet("/authtest", passport.authenticate("jwt", {session:false}))
    public testAuth(@request() request: Request, @response() response: Response){
        console.log(request);
        return "auth successful";
    }
}