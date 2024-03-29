import { ApiError } from "../utils/apiError.js";
import { User } from "../models/users.model.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";


const verifyJWT = asyncHandler(async (req, _, next) => {
    
    // extract token from cookies or headers
    // verify the token using jwt.verify
    // Search for user with _id in payload
    // assign user doc as req property user

    try {
        
        const token = req.cookies?.accessToken || req.header("Authorization").replace("Bearer ", "")

        if(!token){

            throw new ApiError(401, "Unauthorized Request")
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        

        const user = await User.findById(decoded?._id).select("-password -refreshToken")

        if (!user) {
            
            throw new ApiError(401, "Invalid Access Token")
        }


        req.user = user;
        next();

    } catch (error) {
        
        throw new ApiError(401, error?.message || "Invalid access token")

    }


})

export { verifyJWT }