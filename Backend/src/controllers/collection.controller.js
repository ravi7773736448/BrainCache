
import collectionModel from "../models/collection.model.js";

import itemModel from "../models/item.model.js";

export async function createCollection(req, res) {

    try {


        const { name } = req.body;

    

        const userId = req.user.id;

        console.log("User ID from token:", userId,name); // Debugging line to check userId,

        if (!name) {
            return res.status(400).json({
                message: "Collection name is required",
                success: false
            })
        }
        const existingCollection = await collectionModel.findOne({ userId, name });


        if (existingCollection) {
            return res.status(400).json({
                message: "Collection with the same name already exists",
                success: false
            })
        }


        const newCollection = await collectionModel.create({
            userId: userId,
            name: name
        })



        res.status(201).json({
            message: "Collection created successfully",
            success: true,
            collection: newCollection
        })

    }

    catch(err){
        res.status(500).json({ message: "Server error", success: false, error: err.message })
    }


}


export async function getCollections(req, res) {
    try{
        const userId =  req.user.id;

        const collections  = await collectionModel.find({userId : userId}).sort({createdAt : -1})

        res.status(200).json({
            message : "Collections retrieved successfully",
            success : true,
            collections : collections
        })
    }
    catch(err){
        res.status(500).json({ message: "Server error", success: false, error: err.message })
    }
}


export async function deleteCollection(req, res) {
    try{
        const userId =  req.user.id;
        const {id} = req.params;    
        const deletedCollection = await collectionModel.findOneAndDelete({_id : id, userId : userId})

        if(!deletedCollection){
            return res.status(404).json({
                message : "Collection not found or you are not authorized to delete this collection",
                success : false
            })
        }                                   

        res.status(200).json({
            message : "Collection deleted successfully",
            success : true
        })
    }   
    catch(err){
        res.status(500).json({ message: "Server error", success: false, error: err.message })
    }
}