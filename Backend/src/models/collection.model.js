import mongoose from "mongoose";

const collectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,

  },

  name: {
    type: String,
    required: true,
  },

  
},{timestamps :true});

collectionSchema.index({ userId: 1,name : 1 }, { unique: true });


const collectionModel =  mongoose.model("Collection",collectionSchema)
export default collectionModel;