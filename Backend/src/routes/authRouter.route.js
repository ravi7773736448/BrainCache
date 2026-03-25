import {Router} from 'express'
import  * as authController from '../controllers/auth.controller.js'
import { validate } from '../middlewares/validate.middleware.js';
import { registerValidator } from '../validators/user.validator.js';

const authRouter =  Router()



authRouter.post("/register",registerValidator,validate,authController.register) 
authRouter.post("/login",registerValidator,validate,authController.login)



 

export default authRouter;