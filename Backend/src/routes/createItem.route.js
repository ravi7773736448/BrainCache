

import { Router } from "express";
import * as itemController from "../controllers/item.controller.js";
import { urlValidator } from "../validators/url.validator.js";
import { validate } from "../middlewares/validate.middleware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";


const createItemRouter = Router()



createItemRouter.post("/create-item",urlValidator,validate,authMiddleware,itemController.createItem)



createItemRouter.get("/get-items",authMiddleware,itemController.getItem)


createItemRouter.patch("/update-item/:id",authMiddleware,itemController.updateItem)


createItemRouter.delete("/delete-item/:id",authMiddleware,itemController.deleteItem)



export default createItemRouter;