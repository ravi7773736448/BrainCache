import mongoose from "mongoose";

const itemSchema  = new mongoose.Schema({
    userId : {
        type :  mongoose.Schema.Types.ObjectId,
        ref  : "User",
        required : true

    },

    type : {
        type : String,
        enum : ["youtube","x","image","pdf","article"],
        default : "article"
    },

    title : { type: String },

    url : {
        type : String,
        required : [true,"url is required"],
        match: [/^https?:\/\/.+/, "Invalid URL"]
    }
    ,
    content : {
        type : String,

    },
    thumbnail  : {
        type : String,
    },
    tags : [
           {type : String}
    ],
    collectionId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Collection",
        default : null
    },
    isFavorite : {
        type : Boolean,
        default : false
    },
    lastViewdAt  :{
        type : Date,
    }
},{timestamps : true})

itemSchema.index({ userId: 1, url  : 1},{unique:true});
itemSchema.index({ tags: 1 });
itemSchema.index({ userId: 1, isFavorite: 1 });
itemSchema.index({ title: "text", content: "text" ,tags :"text"});

const   itemModel =  mongoose.model("Item",itemSchema)

export default itemModel