import { Router} from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { changePassword, changeProfileImage, loginUser, refreshAccessToken, registerUser, updateDetails } from "../controllers/user.controllers.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route('/register').post(upload.single('profileImage'), registerUser)
router.route('/login').post(loginUser)
router.route('/refresh_access_token').post(refreshAccessToken)

// Protected Routes

router.route('/change_password').post(verifyJWT, changePassword)
router.route('/change_profile_image').post(verifyJWT, upload.single('newProfileImage'), changeProfileImage)
router.route('/update_user_details').post(verifyJWT, updateDetails)

export default router;