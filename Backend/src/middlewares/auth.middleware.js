

import jwt from 'jsonwebtoken'


export async function authMiddleware(req,res,next){
    const token = req.cookies.refreshToken || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({
            success : false,
            message : "Unauthorized"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success : false,
            message : "Invalid token"
        })
    }

}