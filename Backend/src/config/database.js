
import mongoose from "mongoose";



async function connectDB(){

    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("connected to DB")
    }
    catch(err){
        console.log("MONGO DB",err)
    }
}



export default connectDB