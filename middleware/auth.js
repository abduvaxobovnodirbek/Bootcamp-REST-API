const User  = require("../models/User")
const ErrorResponse = require("../utils/errorResponse")
const asyncHandler = require("../middleware/async")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")

dotenv.config()

exports.protect = asyncHandler(async(req,res,next)=>{
    let token;
    
    if(req.headers.authorization && req.headers.authorization.startsWith("Bearer")){
        token = req.headers.authorization.split(" ")[1]
    }

    if(!token){
        next(new ErrorResponse("not authorize",401))
    }

    try {
        let decode = jwt.verify(token,process.env.JWT_SECRET)
        req.user = await User.findById(decode.id)
        next()
    } catch (error) {
        next(new ErrorResponse("not authorize",401))
    }
})

exports.authorize = (...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new ErrorResponse(` ${req.user.role} is not authorized to acces this route`,403))
        }
        next()
    }
}