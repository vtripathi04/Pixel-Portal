import mongoose from "mongoose"
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema(
{

    firstname: {
        type: String,
        required: true
    },

    lastname: {
        type:String, 
        required:true,
        default: ""
    },

    email: {
        type: String,
        required: true,
        unique:true
    },

    username:{
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: [true, "Password Field is Required !"]
        // minLength: [4, "Password must be more than 4 characters !"]
    },

    profileImage: {
        type: String
    }


}, {timestamps:true})




userSchema.pre('save', async function(next) {
  try {
    if (!this.isModified('password')) {
      return next();
    }

    const hashedPassword = await bcrypt.hash(this.password, 10);

    if (!hashedPassword) {
      throw new Error('bcrypt.hash() returned undefined');
    }

    this.password = hashedPassword;

    next();
  } catch (error) {
    console.error('Error during password hashing:', error);
    next(error);
  }
});




export const User = new mongoose.model("User", userSchema)