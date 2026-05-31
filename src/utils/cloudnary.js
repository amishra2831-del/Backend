import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.cloudinary_cloud_name,
    api_key: process.env.cloudinary_api_key,
    api_secret: process.env.cloudinary_api_secret
});

const uploadoncloudnary = async (localfilepath) => {
    try {
        if (!localfilepath) return null;
        // upload
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto",
        });
        // file has been uploaded
        //console.log("file is uploaded", response.url);
        fs.unlinkSync(localfilepath)
        return response;
    } catch (error) {
    console.log("Cloudinary Error:", error);

    try {
        if (localfilepath && fs.existsSync(localfilepath)) {
            fs.unlinkSync(localfilepath);
        }
    } catch (e) {
        console.log("File delete error:", e);
    }

    return null;
}
};

export { uploadoncloudnary };