import express = require("express");
// import { User } from "../models/user";
import { UserService } from "../services/user.srv";
import { AuthenticationService } from "../services/authentication.srv";

let bodyParser = require('body-parser');
let userRouter = express.Router();

userRouter.use(bodyParser.urlencoded({ extended: false}));
userRouter.use(bodyParser.json());

userRouter.get('/', (request: express.Request, response: express.Response) => {
    let testData = {
        message:"this is a user router"
    }

    response.send(testData);
});

userRouter.post('/register', (request: express.Request, response: express.Response) => {
    UserService.register(request.body).then((user) => {
        console.log("registration successful");
        console.log(user);
        let token = AuthenticationService.createToken(user);
        response.status(200).send({registration: true, token: token});
    }).catch(err => {
        console.log("registration unsuccessful");
        response.status(400).send({registration: false, message: err});
    });
});

userRouter.post('/login', (request: express.Request, response: express.Response) => {
    UserService.login(request, response);
});

export = userRouter;