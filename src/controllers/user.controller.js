import { asynchandler } from "../utils/asynchandler.js";
import { apierror} from "../utils/apiError.js";
import { user } from "../models/user.model.js";
import {cloudnary, upload} from "../utils/cloudnary.js";
import {Apiresponse} from "../utils/Apiresponse.js";

const registeruser = asynchandler( async (req,res) =>{
        // get  user detai;s from frontend
        const {fullname,username,email,password} = req.body
        console.log("email" , email);
        // if(fullname == null){
        //     throw new apierror (400 , "full name is required")
        // }

        if (
            [fullname,username,emqil,password].some((field) =>
                field?.trim() === ""
            ) 
        ) {
                    throw new apierror (400 ,"All fields are requiredd")
            }

       const existeduser =    user.findOne({
            $or: [{username} , {email}]
        }) 

        if (existeduser) {
            throw new apierror(409 , "User with email is already existed")
        }
          const avatarlocal =   req.files?.avatar[0]?.path;
         const coverimage =  req.files?.coverimage[0]?.path ;

         if(!avatarlocal) {
            throw new apierror(400 , "  Avatar file is necessary")
         }
      const avatar =  await uploadoncloudnary(avatarlocal)
      const coverimage = await uploadoncloudnary(coverimage)

      if(!avatar){
                     throw new apierror(400 , "  Avatar file is necessary")
      }

    const user =  await user.create({
        fullname,
        avatar : avatar.url,
        coverimage : coverimage?.url || " ",
        email,
        password,
        username: username.toLowerCase()

      })

const createduser =     await user.findbyId(user._id).select(
    "-password -refreshtoken"
)

if(!createduser) {
    throw new apierror(500 , "Something went wrong while  registering the user")
}
            return res.status(201).json(
                new Apiresponse(200 , createduser , "user registered successfully")
            )
})

export {registeruser};