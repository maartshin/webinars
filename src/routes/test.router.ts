import express = require("express");
import passport =  require("passport");

let testRouter = express.Router();
testRouter.get('/',passport.authenticate("jwt", 
            {session:false}) , (request: any, response: express.Response) => {
    let testData = {
        message:"this is test"
    }
    console.log(request.user);
    response.send(testData);
});
// add more route handlers here
// e.g. customerRouter.post('/', (req,res,next)=> {/*...*/})
export = testRouter;