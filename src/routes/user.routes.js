import { Router } from "express";
import { loggedout, loginuser, registeruser, refreshaccesstoken, getcurrentuser, updateaccountdetails, updateuseravatar, updateusercoverimage, getuserchannelprofile, getwatchhistory } from "../controllers/user.controller.js";
import {upload} from  "../middlewares/multer.js"
import { verifyJWT, changeCurrentPassword } from "../middlewares/auth.js";

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
router.route("/refresh-token").post(refreshaccesstoken)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)
router.route("/current-user").get(verifyJWT, getcurrentuser)
router.route("/update-account").patch(verifyJWT,updateaccountdetails)
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateuseravatar)
router.route("/coverimage").patch(verifyJWT, upload.single("/cover-image"), updateusercoverimage)
router.route("/c/:username").get(verifyJWT, getuserchannelprofile)
router.route("/history").get(verifyJWT, getwatchhistory)
export default router;