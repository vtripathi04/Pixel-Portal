import { User } from "../models/users.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const registerUser = asyncHandler(async (req, res) => {

    // steps for user registration
    // take user details and password from form
    // check if username and password are as per our requirement
        // Check if user does not already exist
        // username and password are not empty is not empty
        // implement password checker
    // upload image on cloudinary 
        // get image url and save it so that we can save it in our document
    // hash the password using bcrypt
    // Save the hashed password using the user model
    // send response 201 along with creaeted user

    const data = req.body
    const {firstname, lastname, username, email, password} = data
    console.log(data)


    // Making sure no field is empty except lastname
    for (const key in data) {
        const val = data[key]

        if(!val && (key != "lastname" && key!= "profileImage")){
            throw new ApiError(400, "None of the fields can be empty !")
        }
    }


    // Checking if user doesnt already exist

    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists")
    }else{
        console.log(`User is OKAY`);
    }


    // Checking length of passsword is greater than 

    if(password.length < 4){
        throw new ApiError(400, "Password cannot be shorter than 4 characters")
    }


    // Checking file is recieved
    if(data?.profileImage == ""){
        throw new ApiError(400, "You Must upload a profile image !")
    }
    
    
    let profileImageLocalPath;

    if (req.file && req.file.size > 0) {
        // profileImageLocalPath = req.file.path
        profileImageLocalPath = req.file.path
        console.log(profileImageLocalPath);
    }
    
    
    // Uploading image on cloudinary
    
    const profileImage = await uploadOnCloudinary(profileImageLocalPath)
    console.log(profileImage)


    // making entry into the database

    console.log('Before creating user:', { firstname, lastname, email, username, password, profileImage });
    const createdUser = new User({
        firstname,
        lastname,
        email,
        username,
        password : password,
        profileImage: profileImage?.url || ""
    })

        // After creating the user instance
    console.log('After creating user:', createdUser);
    
    try {
        await createdUser.save();
      } catch (error) {
        console.error('Save operation failed:', error);
      }

    res.status(201).json( new ApiResponse(201, createdUser, "User Created Successfully"))


})




export {
    registerUser
}