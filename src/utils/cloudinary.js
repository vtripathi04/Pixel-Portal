import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_APIKEY, 
  api_secret: process.env.CLOUDINARY_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {

    try{

        if(!localFilePath){return null}

        // Uploading local file to cloudinary

        const response = cloudinary.uploader.upload(localFilePath,
        { resource_type: "auto" })

            
        // After file uploaded on cloudinary delete the files

        fs.unlinkSync(localFilePath)
        return response

    }catch(err){
        fs.unlinkSync(localFilePath)
        return null
    }
}


export { uploadOnCloudinary };


