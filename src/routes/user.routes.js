import { Router } from "express";
import { registeruser } from "../controllers/user.controller.js";
import {upload} from  "../middlewares/multer.js"

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


export default router;