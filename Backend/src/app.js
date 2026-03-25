import express from 'express'
import cors from 'cors'
import authRouter from './routes/authRouter.route.js'
import createItemRouter from './routes/createItem.route.js'
import collectionRouter from './routes/collection.route.js'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

const app =  express()

app.use(express.json())
app.use(cors())
app.use(cookieParser())
app.use(morgan("dev"))




app.use("/api/auth",authRouter)
app.use("/api/items",createItemRouter)
app.use("/api/collections",collectionRouter)

export default app;