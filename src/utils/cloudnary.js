import {v2 as cloudnary} from "cloudnary"
import fs from "fs"
 cloudinary.config({ 
        cloud_name:  process.env.cloudinary_cloud_name,
        api_key: process.env.cloudinary_api_key, 
        api_secret: process.env.cloudinary_api_secret// Click 'View API Keys' above to copy your API secret
    });

   const upload = async (localfilepath) =>{
    try {
        if(!localfilepath) return null
        // upload
     const  response = await  cloudnary.uploader.upload(localfilepath ,{
            resource_type: "auto"
        })
        //file has been uploaded
        console.log("file is uploaded" , response.url);
        return response;
        
    } catch (error) {
            fs.unlinkSync(localfilepath) // remove locally temporary file
            return null;
        
    }
   } 

   export {upload}