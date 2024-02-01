import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_APIKEY, 
  api_secret: process.env.CLOUDINARY_SECRET
});



const getImagePublicIdCloudinary = function(img_url){
    const img_url_arr = img_url.split("/")
    const publicId = img_url_arr[img_url_arr.length-1].replace(".png", "")
    return publicId
}

const uploadOnCloudinary = async (localFilePath) => {

    try{

        if(!localFilePath){return null}

        // Uploading local file to cloudinary

        const response = await cloudinary.uploader.upload(localFilePath,
        { resource_type: "auto" })

        // console.log(response)
        // After file uploaded on cloudinary delete the files

        fs.unlinkSync(localFilePath)
        return response

    }catch(err){
        fs.unlinkSync(localFilePath)
        return err
    }
}


const deleteFromCloudinary = async (imgcloudinaryurl) => {


    cloudinary.uploader
    .destroy(getImagePublicIdCloudinary(imgcloudinaryurl), {resource_type: 'image'})
    .then(result => console.log(result)).catch(err => console.log("Error Deleting Image from cloudinary:", err))

}

export { 
    uploadOnCloudinary,
    deleteFromCloudinary 
};


