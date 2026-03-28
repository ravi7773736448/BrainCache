import itemModel from "../models/item.model.js";
import axios from 'axios'
import * as cheerio from 'cheerio'
import sharp from "sharp";
import { getYoutubeMeta, detectType, cleanYoutubeUrl, getUnsplashFromImage, getTwitterFreeMeta, getArticleMeta } from "../utils/url.js";

import ogs from 'open-graph-scraper'
import { response } from "express";
import { aiChat } from "../services/ai.service.js";

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



     let tags =    await aiChat({title,description})


     


        // 🔹 Create item
        const item = await itemModel.create({
            userId,
            url: normalizedLink,
            type,
            title,
            content: description,
            thumbnail,
            tags,
            lastViewdAt : new Date()
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
        const userId = req.user.id;

        // 📄 Pagination
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // 📥 Query params
        const {
            collectionId,
            search,
            type,
            favorite,
            tag,
            sort
        } = req.query;

        // 🔍 Base filter
        const filter = { userId };

        // 🔎 Text search
        if (search && search.trim() !== "") {
            filter.$text = { $search: search };
        }

        // 📂 Collection filter
        if (collectionId !== undefined) {
            if (collectionId === "null") {
                filter.collectionId = null;
            } else {
                filter.collectionId = collectionId;
            }
        }

        // 📌 Type filter
        if (type && type !== "null") {
            filter.type = type;
        }

        // ⭐ Favorite filter (string → boolean)
        if (favorite === "true") {
            filter.isFavorite = true;
        } else if (favorite === "false") {
            filter.isFavorite = false;
        }

        // 🏷️ Tag filter ($in)
        if (tag && tag !== "null") {
            const tagArray = tag
                .split(",")
                .map(t => t.trim())
                .filter(Boolean); // remove empty values

            if (tagArray.length > 0) {
                filter.tags = { $in: tagArray };
            }
        }

        // 🔃 Sorting (default = recent)
        let sortOption = { createdAt: -1 };

        if (sort === "recent") {
            sortOption = { createdAt: -1 };
        } 
        else if (sort === "oldest") {
            sortOption = { createdAt: 1 };
        } 
        else if (sort === "favorite") {
            sortOption = { isFavorite: -1, createdAt: -1 };
        } 
        else if (sort === "viewed") {
            sortOption = { lastViewedAt: -1, createdAt: -1 };
        }

        // 🧠 Optional: prioritize text score when searching
        // if (search && search.trim() !== "") {
        //     sortOption = { score: { $meta: "textScore" } };
        // }

        // 🚀 Query execution
        const items = await itemModel
            .find(filter)
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const totalItems = await itemModel.countDocuments(filter);

        // ✅ Response
        return res.status(200).json({
            success: true,
            message: "Items retrieved successfully",
            page,
            limit,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            items
        });

    } catch (err) {
        console.error("GET ITEMS ERROR:", err);

        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
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