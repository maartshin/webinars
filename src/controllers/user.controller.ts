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

// let bodyParser = require('body-parser');
// let userRouter = express.Router();

// userRouter.use(bodyParser.urlencoded({ extended: false}));
// userRouter.use(bodyParser.json());

// userRouter.get('/', (request: express.Request, response: express.Response) => {
//     let testData = {
//         message:"this is a user router"
//     }

//     response.send(testData);
// });

// userRouter.post('/register', (request: express.Request, response: express.Response) => {
//     UserService.register(request.body).then((user) => {
//         console.log("registration successful");
//         console.log(user);
//         let token = AuthenticationService.createToken(user);
//         response.status(200).send({registration: true, token: token});
//     }).catch(err => {
//         console.log("registration unsuccessful");
//         response.status(400).send({registration: false, message: err});
//     });
// });

// userRouter.post('/login', (request: express.Request, response: express.Response) => {
//     UserService.login(request, response);
// });

// export = userRouter;

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
        return this.userService.login(request, response);
    }

    @httpGet("/authtest")
    public testAuth(){
        return "auth successful";
    }
}