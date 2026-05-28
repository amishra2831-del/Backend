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
const refreshaccesstoken = asynchandler(async(req,res)=>{
   const incomingrefreshtoken =  req.cookies.refreshtoken ||req.body.refreshtoken

   if(!incomingrefreshtoken) {
    throw new apiError(401, "Unauthorised request")
   }
 try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})
export { registeruser , loginuser, loggedout, refreshaccesstoken }