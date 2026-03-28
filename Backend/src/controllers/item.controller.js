import itemModel from "../models/item.model.js";
import axios from 'axios'
import * as cheerio from 'cheerio'
import sharp from "sharp";
import { getYoutubeMeta, detectType, cleanYoutubeUrl, getUnsplashFromImage, getTwitterFreeMeta, getArticleMeta } from "../utils/url.js";

import ogs from 'open-graph-scraper'
import { response } from "express";

export async function createItem(req, res) {
    try {
        const { link } = req.body;
        const userId = req.user.id;

        if (!link) {
            return res.status(400).json({
                message: "Link is required",
                success: false
            });
        }

        // 🔹 Normalize URL
        const normalizedLink = link.trim().replace(/\/$/, "");

        // 🔹 Check duplicate
        const exists = await itemModel.findOne({
            userId,
            url: normalizedLink
        });

        if (exists) {
            return res.status(409).json({
                message: "Item already exists",
                success: false
            });
        }



        // 🔹 Detect type
        const type = detectType(normalizedLink);

        let title = "";
        let description = "";
        let thumbnail = "";

        // 🔥 Handle based on type
        if (type === "youtube") {

            const cleanurl = cleanYoutubeUrl(normalizedLink)
            const ytData = await getYoutubeMeta(cleanurl);

            if (ytData) {
                title = ytData.title;
                thumbnail = ytData.thumbnail;
                description = ytData.content;
            } else {
                title = "YouTube Video";
            }

        } else if (type === "image") {



            try {
                const response = await axios.get(normalizedLink, { responseType: "arraybuffer" })

                const buffer = Buffer.from(response.data);


                const metadata = await sharp(buffer).metadata();

                title = `Image (${metadata.width}x${metadata.height})`;
                thumbnail = normalizedLink;
                description = `Format: ${metadata.format.toUpperCase()} | Space: ${metadata.space}`;

                console.log("Image processed successfully:", { title, thumbnail });



            }
            catch (err) {
                console.error("Error processing direct image:", err.message);
                // Fallback if Sharp/Axios fails
                title = "Uploaded Image";
                thumbnail = normalizedLink;
            }











        }
        else if (type === "x") {

            const response = await getTwitterFreeMeta(normalizedLink)

            if (response) {
                title = response.title;
                description = response.description;
                thumbnail = response.image;
            } else {
                title = "X Post";
                description = "";
                thumbnail = "";
            }
        }

        else if (type === "article") {

            console.log("🔥 Article block running");
            const articleData = await getArticleMeta(normalizedLink);

            console.log(articleData)

             title =  articleData.title,
             description =  articleData.description,
             thumbnail =  articleData.image
        }

        else if (type === "pdf") {

            const fileName = normalizedLink.split("/").pop();

            title = fileName || "PDF Document";
            description = "PDF File";
            thumbnail = "https://cdn-icons-png.flaticon.com/512/337/337946.png";
        }



        // 🔹 Create item
        const item = await itemModel.create({
            userId,
            url: normalizedLink,
            type,
            title,
            content: description,
            thumbnail
        });

        return res.status(201).json({
            message: "Item created successfully",
            success: true,
            item
        });

    } catch (error) {
        console.error("Create Item Error:", error);

        return res.status(500).json({
            message: "Server error",
            success: false,
            error: error.message
        });
    }
}



export async function getItem(req, res) {


    try {
        let isFavorite;
        const userId = req.user.id;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const { collectionId, search,type,favorite } = req.query;

        const skip = (page - 1) * limit; //10

        

        const filter = { userId }


        isFavorite =  favorite
        




        if (search && search.trim() !== "") {
            filter.$text = { $search: search };
        }

        let sortOption = { createdAt: -1 };


        if (search && search.trim() !== "") {
            sortOption = { score: { $meta: "textScore" } };
        }


        if (collectionId !== undefined) {
            if (collectionId === "null") {
                filter.collectionId = null
            }
            else {
                filter.collectionId = collectionId
            }
        }

        if(type !== undefined){
            if(type === "null"){
                filter.type = type
            }
            else{
                filter.type = type
            }
        }

       
        if(isFavorite !== undefined){
            if(isFavorite === "null"){
                filter.isFavorite = isFavorite
            }
            else{
                filter.isFavorite = isFavorite
            }
        }



        
        const items = await itemModel.find(filter).sort(sortOption).skip(skip).limit(limit);
        const totalItems = await itemModel.countDocuments(filter);








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
        const { title, tags, isFavorite, collectionId } = req.body;


        if (title === undefined && tags === undefined && isFavorite === undefined && collectionId === undefined) {
            return res.status(400).json({ message: "At least one field (title, tags, isFavorite,collectionId) must be provided for update", success: false })
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (tags !== undefined) updateData.tags = tags;
        if (isFavorite !== undefined) updateData.isFavorite = isFavorite;
        if (collectionId !== undefined) updateData.collectionId = collectionId;






        const updateItemData = await itemModel.findByIdAndUpdate({
            _id: id, userId: req.user.id
        }, updateData, { new: true })


        if (!updateItemData) {
            return res.status(404).json({
                message: "Item not found or you are not authorized to update this item",
                success: false,

            })
        }


        res.status(200).json({ message: "Item updated successfully", success: true, item: updateItemData })

    }
    catch (err) {
        res.status(500).json({ message: "Server error", success: false, error: err.message })
    }







}



export async function deleteItem(req, res) {
    try {

        const { id } = req.params;

        const userId = req.user.id;

        const deleteItemData = await itemModel.findOneAndDelete({ _id: id, userId: userId })


        if (!deleteItemData) {
            return res.status(404).json({ message: "Item not found or you are not authorized to delete this item", success: false })
        }

        res.status(200).json({ message: "Item deleted successfully", success: true, deletedId: id })

    }
    catch (err) {
        res.status(500).json({ message: "Server error", success: false, error: err.message })
    }
}