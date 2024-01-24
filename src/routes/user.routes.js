import { Router} from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { registerUser } from "../controllers/user.controllers.js";


const router = Router()

router.route('/register').post(upload.single('profileImage'), registerUser)



export default router;