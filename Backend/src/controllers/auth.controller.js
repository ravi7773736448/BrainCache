import bcrypt from 'bcrypt'
import userModel from '../models/user.model.js';
import jwt from 'jsonwebtoken';

export async function register(req,res){
    const {username,email,password} =  req.body;



    const isAlreadyUser =  await userModel.findOne({
        $or : [{username},{email}]
    })

    if(isAlreadyUser){
        return res.status(409).json({
            success : false,
            message : "User already exists"
        })
    }


    const user =  await userModel.create({
        username,email,password
    })


const accessToken =  jwt.sign({id : user._id,username : user.username,email :user.email},process.env.JWT_SECRET,{expiresIn: "15min"})
const refreshToken =  jwt.sign({id : user._id,username : user.username,email :user.email},process.env.JWT_SECRET,{expiresIn: "7d"})

res.cookie("refreshToken",refreshToken,{
    httpOnly : true,
    secure : true,
    sameSite : "strict",
    maxAge : 7 * 24 * 60 * 60 * 1000 // 7 days
})


res.status(201).json({
    message : "User registered successfully",
    success : true,
    accessToken
})










}


export  async function login(req,res){
    const {username,email,password} =  req.body;


    const user  =  await userModel.findOne({
        $or : [{username},{email}]
    }).select("+password")


    if(!user){
        return res.status(400).json({
            message : "Invalid credentials",
            success : false,
        })
    }

    const isPasswordMatch =  await user.comparePassword(password)

    if(!isPasswordMatch){
        return res.status(400).json({
            message : "Invalid credentials",
            success : false,
        })
    }

    const accessToken =  jwt.sign({id : user._id,username : user.username,email :user.email},process.env.JWT_SECRET,{expiresIn: "15min"})
    const refreshToken =  jwt.sign({id : user._id,username : user.username,email :user.email},process.env.JWT_SECRET,{expiresIn: "7d"})


    res.cookie("refreshToken",refreshToken,{
        httpOnly : true,
        secure : true,
        sameSite : "strict",
        maxAge : 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    res.status(200).json({
        message : "Login successful",
        success : true,
        accessToken
    })
}
