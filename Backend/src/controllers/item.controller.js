import itemModel from "../models/item.model.js";

export async function createItem(req, res) {


    try {
        const { link, title } = req.body;
        const userId = req.user.id;

        // Normalize link
        const normalizedLink = link.trim().toLowerCase().replace(/\/$/, "");

        // Check duplicate
        const isAlreadyItem = await itemModel.findOne({ userId, url: normalizedLink });
        if (isAlreadyItem) {
            return res.status(409).json({ message: "Item already exists", success: false });
        }

        // Detect type
        let type = "article"; // Default type
        const url = normalizedLink;

        if (url.includes("youtube.com") || url.includes("youtu.be")) type = "youtube";
        else if (url.includes("twitter.com") || url.includes("x.com")) type = "twitter";
        else if (url.endsWith(".pdf")) type = "pdf";
        else if (url.includes("images.unsplash.com") || url.includes("cdn.pixabay.com") || url.includes("plus.unsplash.com")) {
            type = "image";
        }
        else type = "article"

        // Create item
        const useritem = await itemModel.create({ userId, url: normalizedLink, type, title });

        res.status(201).json({ message: "Item created successfully", success: true, item: useritem });

    } catch (error) {
        res.status(500).json({ message: "Server error", success: false, error: error.message });
    }
}



export async function getItem(req, res) {


    try {
        const userId = req.user.id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;

        const skip = (page - 1) * limit; //10

        const items = await itemModel.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit);
        const totalItems = await itemModel.countDocuments({ userId });

        if (items.length === 0) {
            return res.status(404).json({ message: "No items found", success: false })
        }


        res.status(200).json({
            message: "Items retrieved successfully",
            success: true,
            page: page,
            limit: limit,
            items: items,
            totalItems: totalItems,
            totalPages: Math.ceil(totalItems / limit)
        })
    }
    catch (err) {
        res.status(500).json({ message: "Server error", success: false, error: err.message })
    }



}


export async function updateItem(req, res) {


    try {
        const { id } = req.params;
        const { title, tags, isFavorite } = req.body;


        if(!title && !tags && isFavorite === undefined){
            return res.status(400).json({ message: "At least one field (title, tags, isFavorite) must be provided for update", success: false })
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (tags !== undefined) updateData.tags = tags;
        if (isFavorite !== undefined) updateData.isFavorite = isFavorite;






        const updateItemData = await itemModel.findByIdAndUpdate({
            _id : id, userId : req.user.id
        }, updateData, { new: true })


        if(!updateItemData){
            return  res.status(404).json({
                message  : "Item not found or you are not authorized to update this item",
                success : false,
                
            })
        }


        res.status(200).json({ message: "Item updated successfully", success: true, item: updateItemData })

    }
    catch(err){
        res.status(500).json({ message: "Server error", success: false, error: err.message })
    }



    



}


export async function deleteItem(req,res){
    try{

        const {id} =  req.params;

        const userId =  req.user.id;

        const deleteItemData = await itemModel.findOneAndDelete({_id : id, userId : userId})


        if(!deleteItemData){
            return res.status(404).json({ message: "Item not found or you are not authorized to delete this item", success: false })
        }

        res.status(200).json({ message: "Item deleted successfully", success: true })

    }
    catch(err){
        res.status(500).json({ message: "Server error", success: false, error: err.message,deletedId: id })
    }
}