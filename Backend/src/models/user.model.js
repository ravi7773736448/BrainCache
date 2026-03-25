import mongoose from "mongoose";
import bcrypt from "bcrypt";



const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is required"],

    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: true,


    },
    password: {
        type: String,
        required: [true, " password is required"],
        select: false
    }
}, { timestamps: true })
userSchema.index({ username: 1 });


userSchema.pre("save", async function () {
    try {
        if (!this.isModified("password")) return;

        this.password = await bcrypt.hash(this.password, 10);

   
        
    } catch (err) {
        console.log(err); 
    }
});

userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}
const userModel = mongoose.model("User", userSchema)

export default userModel;