import { User } from "../models/users.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { urlencoded } from "express";


const generateAccessAndRefreshToken = function(user){

    try {
        const accessToken = jwt.sign({_id:user._id ,username: user.username, email: user.email},
             process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'})
    
        const refreshToken = jwt.sign({_id:user._id, username: user.username},
            process.env.REFRESH_TOKEN_SECRET, {expiresIn: '1d'})


        return {accessToken, refreshToken}  

    } catch (error) {
        throw new ApiError(400, `Cannot Generate Access and Refresh Tokens : ${error}`)

    }

}




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




const updateRefreshToken = async function(user, refreshToken){

    try {
        await User.updateOne({_id: user._id}, {refreshToken: refreshToken})
    } catch (error) {
        throw new ApiError(409, "Couldn't Update User Refresh Token")
    }
}


const loginUser = asyncHandler(async (req, res) => {
    // General Steps
    // check and verify username and password
    // use the user property in req assigned by middleware verifyJWT
    // generate refresh and access token for the user
    // save the refresh token in the user document on mongodb
    // send the access token in the cookies back to the user
    
    const {username, password} = req.body

    // Fetching User from model query
    const loginUser = await User.findOne({username: username})

    if(!loginUser){
        throw new ApiError(409, `User with username: ${username} does not exist !`)
    }

    // Checking if password matches the hash

    const matchingPasswords = await loginUser.checkPassword(password)



    if(!matchingPasswords){
        throw new ApiError(400, "Password Entered is not Correct")
    }

    const {accessToken, refreshToken} = generateAccessAndRefreshToken(loginUser)

    updateRefreshToken(loginUser, refreshToken)



    const loggedInUser = await User.findById(loginUser._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    res.status(201).cookie('accessToken', accessToken ,options)
    .cookie('refreshToken', refreshToken, options )
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )


})



const changePassword = asyncHandler(async (req, res) => {

    // protected route controller
    // take old and new password
    // check if old password is correct
        // By bcrypt compare
    //  get user and change password field
    // save it
    //  hashed new password will be stored by the middleware in the db
    
    const {currPassword, newPassword} = req.body


    const user = await User.findById(req.user?._id)

    const matchingPass = await user.checkPassword(currPassword)

    if(!matchingPass){  
        throw new ApiError(409, "Current Password Entered Does not Match !")
    }

    user.password = newPassword


    try {
        await user.save()
    } catch (error) {
        throw new ApiError(409, "Could not Save User Details !")
    }

    
    res.status(200)
    .json(new ApiResponse(200, {user:req.user}, "Password Changed Successfully !"))

})



const changeProfileImage = asyncHandler( async (req, res) => {

    // get user obj
    // get new profile pic
    // upload on cloudinary and get the link
    // update the profileImage property of user doccument

    // const {newProfileImage} = req.file

    const user = await User.findById(req.user?.id)

    console.log(user);
    console.log(req.file);

//     cloudinary.v2.api
//   .delete_resources([user.profileImage], 
//     { type: 'upload', resource_type: 'image' })
//   .then(console.log);

    try {
        await deleteFromCloudinary(user.profileImage)
    } catch (error) {
        throw new ApiError(402, "Couldn't Delete Old Profile Image")
    }



    const newProfileImg = await uploadOnCloudinary(req.file.path)
    console.log(newProfileImg);

    user.profileImage = newProfileImg?.url || "";


  

    try {
        await user.save()
    } catch (error) {
        throw new ApiError(409, "Could not Save User Details !")
    }

    
    res.status(200)
    .json(new ApiResponse(200, {user:req.user}, "Profile Image Changed Successfully !"))
    
})




const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }

    )


    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))

})




const generateAccessToken = function(user){

    try {
        const accessToken = jwt.sign({_id:user._id ,username: user.username, email: user.email},
             process.env.ACCESS_TOKEN_SECRET, {expiresIn: '15m'})

        return {accessToken}

    } catch (error) {
        throw new ApiError(400, `Cannot Generate Access Tokens : ${error}`)

    }

}


const refreshAccessToken = asyncHandler(async (req, res) => {

    // Have to add error handling

    // get cookies from user
    // decode token and find user id
    // if the tokens match then we generate an access token 
    // we send this access token as a cookie back to the user

    const refreshToken = req.cookies?.refreshToken
    console.log(refreshToken);


    const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)
    console.log(decodedRefreshToken);


    const user = await User.findById(decodedRefreshToken?._id)
    console.log(user);


    const { accessToken } = generateAccessToken(user)
    console.log(accessToken);


    const options = {
        httpOnly: true,
        secure: true
    }


    res.status(201)
    .cookie('accessToken', accessToken, options)
    .json(new ApiResponse(
        200,
        {
            user: user, accessToken, options
        },
        "Access Token Refreshed Sucessfully"
    ))


})



const updateDetails = asyncHandler( async(req, res) => {

    // get new username, name and email
    // if non empty fields then make the necessary changes in user document
    // save user document 

    const {firstname, lastname, username, email} = req.body

    // const user = await User.findById(req.user._id)

    // if(!user){
    //     throw new ApiError(402, "User Not Found !")
    // }

    try {
        
        const updateUser = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set : {firstname: firstname, lastname: lastname, username: username, email:email}
            }
        )


        const user = await User.findById(updateUser._id)

        return res.status(200)
        .json(new ApiResponse(
            201,
            {
                user: user
            },
            "User updated !")
        )

    } catch (error) {
        throw new ApiError(400, "Could Not Update User !")
    }
    

})



const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})



const getUserProfile = asyncHandler(async (req, res) => {

})


export {
    registerUser,
    loginUser,
    changePassword,
    changeProfileImage,
    refreshAccessToken,
    updateDetails,
    getCurrentUser,
    getUserProfile
}