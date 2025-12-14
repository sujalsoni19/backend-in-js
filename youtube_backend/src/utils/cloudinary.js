import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET
});

//Temporary storage exists because the server must fully receive and verify a file before it can send it to Cloudinary.
//Files are sent in chunks so the internet can send large data reliably, safely, and recover from failures.

const uploadOnCloudinary = async(localFilePath) => {
    try {
        if(!localFilePath) return null

        //upload on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        console.log("file is uploaded on cloudinary",response.url);

        fs.unlinkSync(localFilePath); // cleanup after success
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath)//REMOVE THE LOCALLY SAVED TEMP FILE AS THE UPLOAD OPERATION GOT FAILED
    }
}

