import mongoose, {Schema} from "mongoose";

const playlistschema = new Schema({
    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    videos : {
        type: Schema.Types.ObjectId,
        ref: "Video",
     },

      creater : {
        type: Schema.Types.ObjectId,
        ref: "User",
     },

}, {timestamps: true})

export const Playlist = mongoose.model("Playlist" , playlistschema)