import { Router } from "express";
import { loggedout, loginuser, registeruser } from "../controllers/user.controller.js";
import {upload} from  "../middlewares/multer.js"
import { verifyJWT } from "../middlewares/auth.js";

const router = Router()

router.route("/register").post(
    upload.fields([
{
        name : "avatar" ,
        maxcount :1
} ,
{
    name: "coverimage" ,
    maxcount : 1
}
    ]),
    
    registeruser
)

router.route("/login").post(loginuser)

//secure routes

router.route("/logout").post(verifyJWT , loggedout)
export default router;