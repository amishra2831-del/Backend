import { asynchandler } from "../utils/asynchandler.js";
import { apiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadoncloudnary } from "../utils/cloudnary.js";
import Apiresponse from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";
// res -> _ wriiteen
const generateaccesstokenandrefreshtoken = async (userid) => {
    try {
        const user = await User.findById(userid);
        if (!user) throw new apiError(404, "User not found");
        const accessToken = user.generateaccesstoken();
        const refreshtoken = user.generaterefreshtoken();
        user.refreshtoken = refreshtoken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshtoken };
    } catch (error) {
        throw new apiError(500, "Something went wrong");
    }
};

const registeruser = asynchandler(async (req, res) => {
    // get user details from frontend
//console.log(req.body);

    
    const { fullname, username, email, password } = req.body;

    if ([fullname, username, email, password].some((field) => !field || field?.toString().trim() === "")) {
        throw new apiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        throw new apiError(409, "User with provided username or email already exists");
    }

    const avatarlocal = req.files?.avatar?.[0]?.path;
    const coverimagelocal = req.files?.coverimage?.[0]?.path;

    if (!avatarlocal) {
        throw new apiError(400, "Avatar file is required");
    }

    const avatar = await uploadoncloudnary(avatarlocal);
    const coverimage = await uploadoncloudnary(coverimagelocal);

    if (!avatar) {
        throw new apiError(400, "Failed to upload avatar");
    }

    const newUser = await User.create({
        fullname,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    }); 

    console.log(req.body);

    const createdUser = await User.findById(newUser._id).select("-password -refreshtoken");

    if (!createdUser) {
        throw new apiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(new Apiresponse(201, createdUser, "User registered successfully"));
});


const loginuser = asynchandler(async (req, res) => {
            // req body -> data
            // username or email
            // find the user
            // password check
            // access and refresh token

            // send in secure cookkie

    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new apiError(400, "username or email required");
    }

    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
        throw new apiError(400, "User does not exist");
    }

    const isPasswordvalid = await user.isPasswordCorrect(password);
    if (!isPasswordvalid) {
        throw new apiError(401, "Invalid user credentials");
    }

    const { accessToken, refreshtoken } = await generateaccesstokenandrefreshtoken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshtoken");

    const options = { httpOnly: true, secure: true };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshtoken", refreshtoken, options)
        .json(
            new Apiresponse(
                200,
                { user: loggedInUser, accessToken, refreshtoken },
                "User logged Successfully"
            )
        );
});

const loggedout = asynchandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshtoken: undefined } },
        { new: true }
    );

    const options = { httpOnly: true, secure: true };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshtoken", options)
        .json(new Apiresponse(200, {}, "User logged out"));
});
const refreshaccesstoken = asynchandler(async (req, res) => {
    const incomingrefreshtoken = req.cookies.refreshtoken || req.body.refreshtoken;

    if (!incomingrefreshtoken) {
        throw new apiError(401, "Unauthorised request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingrefreshtoken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new apiError(401, "Invalid refresh token");
        }

        if (incomingrefreshtoken !== user?.refreshtoken) {
            throw new apiError(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshtoken } = await generateaccesstokenandrefreshtoken(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshtoken", refreshtoken, options)
            .json(
                new Apiresponse(
                    200,
                    { accessToken, refreshtoken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh token");
    }
});

const changeCurrentPassword = asynchandler(async (req, res) => {
    const { oldpassword, newpassword } = req.body;
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new apiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);
    if (!isPasswordCorrect) {
        throw new apiError(400, "Invalid password");
    }

    user.password = newpassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new Apiresponse(200, {}, "Password Changed"));
});

const getcurrentuser = asynchandler(async (req, res) => {
    return res.status(200).json(new Apiresponse(200, req.user, "current user fetched successfully"));

    const updateaccountdetails = asynchandler(async(req,res) =>{
        const {fullname, email} = req.body

        if(!fullname || !email) {
            throw new apiError(400, "All Fields are required")
        }

        User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    fullname: fullname,
                    email:email
                }
            },
            {new: true}
        ).select("-password")

        return res
        .status(200)
        .json(new Apiresponse(200, user, "Account Details Updated"))
    })

    const updateuseravatar = asynchandler(async(req,res) =>{
        const avatarlocal = req.file?.path

        if(!avatarlocal) {
            throw new apiError(400, "Avatar file is missing")
        }

        const avatar=  await uploadoncloudnary(avatarlocal)
        if(!avatar.url){
            throw new apiError(400, "Error while uploading")
        }

    const user=  await User.findOneAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar: avatar.url
                }
            },
            {new: true}
        ).select("-password")

         return res
        .status(200)
        .json(
            new Apiresponse(200, user, "Avatar Image Updated")
        )
    })

    const updateusercoverimage = asynchandler(async(req,res) =>{
        const coverimagelocal = req.file?.path

        if(!coverimagelocal) {
            throw new apiError(400, "Avatar file is missing")
        }

        const coverimage =  await uploadoncloudnary(avatarlocal)
        if(!coverimage.url){
            throw new apiError(400, "Error while uploading")
        }

   const user = await User.findOneAndUpdate(
            req.user?._id,
            {
                $set:{
                    avatar: avatar.url
                }
            },
            {new: true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new Apiresponse(200, user, "Cover Image Updated")
        )
    })

    const getuserchannelprofile = asynchandler(async(req,res)=>{
        const {username} = req.params

        if(!username?.trim()) {
            throw new apiError(400, )
        }

     const channel =    await User.aggregate([
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
                {
                    $lookup: {
                        from: "subscriptions",
                        localField: "_id",
                        foreignField: "channel",
                        as: "subscribers"
                    }
                },
                {
                    $lookup: {
                        from: "subscriptions",
                        localField: "_id",
                        foreignField: "subscriber",
                        as: "subscribed"
                    }
                },
                {
                    $addFields: {
                        subscriberscount: {
                            $size: "$subscribers"
                        },

                        channelsubscribedcount: {
                            $size: "$subscribed"
                        },
                          issubscribed: {
                            $cond: {
                                if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                                then: true,
                                else: false
                            }
                          }  
                    }
                },

                {
                    $project: {
                        fullname: 1,
                        username: 1,
                        subscriberscount: 1,
                        channelsubscribedcount: 1,
                        issubscribed: 1,
                        avatar: 1,
                        coverimage: 1,
                        email: 1
                    }
                }
            
        ])

        if(!channel?.length){
            throw new apiError(404, "channel does not exist")
        }

        return res
        .status(200)
        .json(
            new Apiresponse(200, channel[0] ,"User channel fetched successfully")
        )

    })

    const getwatchhistory = asynchandler(async(req,res) =>{
        const user = await User.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.objectid(req.user._id)
                }
            },
            {
                $lookup: {
                    from: "video",
                    localField: "watchhistory",
                    foreignField: "_id",
                    as: "watchHistory",
                    pipeline: [
                        {
                            $lookup: {
                                from: "users",
                                localField: "owner",
                                foreignField: "_id",
                                as: "owner",

                                pipeline: [
                                    {
                                        $project: {
                                            fullname: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    },
                                    {
                                        $addFields: {
                                            owner: {
                                                $first: "$owner"
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    ]
             }
            }
        ])

        return res.
        status(200)
        .json(
            new Apiresponse(
                200,
                user[0].watchhistory,
                "Watch History Fetched Successfully!"
            )
        )
    })

});


export { registeruser, loginuser, loggedout, refreshaccesstoken, getcurrentuser, updateaccountdetails, updateuseravatar, updateusercoverimage, getuserchannelprofile, getwatchhistory }
