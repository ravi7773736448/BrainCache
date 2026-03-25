
import { Router  } from "express";
import * as collectionController from "../controllers/collection.controller.js"

import { authMiddleware } from "../middlewares/auth.middleware.js";

const collectionRouter = Router();





collectionRouter.post("/create-collection",authMiddleware,collectionController.createCollection)

collectionRouter.get("/get-collections",authMiddleware,collectionController.getCollections)

collectionRouter.delete("/delete-collection/:id",authMiddleware,collectionController.deleteCollection)


export default collectionRouter;