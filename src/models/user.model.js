import mongoose , {Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        username: {
            type: String,
            required:true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required:true,
            unique: true,
            lowercase: true,
            trim: true,
            
        },
        fullname: {
            type: String,
            required:true,
            trim: true,
            index:true
        },
        avatar:{
            type:String,
            // cloudinary url
            required:true
        },
        coverimage: {
            type:String
        },
        watchhistory: [
            {
                type: Schema.type.objectid,
                ref:"Video"

        }
    ],

    password: {
        type: String,
        required: [true , 'Password is required']
    },
    refreshtoken:{
        type:String
    }

}
)
userSchema.pre("save" , async function (next) {
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password, 10)
    next()
})
userSchema.methods.isPasswordcorrect = async function (password){
   return await bcrypt.compare(password , this.password)
}
userSchema.methods.generateaccesstoken = function (){
   return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            username: this.fullname
        },
        process.env.access_token_secret,
        {
            expiresIn: process.env.access_token_exp
        }
    )

    userSchema.methods.generaterefreshtoken = function(){
         return jwt.sign(
        {
            _id : this._id,
            
        },
        process.env.refresh_token_secret,
        {
            expiresIn: process.env.refresh_token_exp
        }
    )
    }
}

export const user = mongoose.model("user" , userSchema )