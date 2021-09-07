const ErrorResponse = require("../utils/errorResponse")

const errorHandler = (err,req,res,next)=>{
    
   if(err.code === 11000){
       const error = new ErrorResponse(`Duplicate field value entered`,400)
       err.message = error.message
       err.statusCode = error.statusCode
   }
   
   if(err.name === "ValidationError"){
       const message = Object.values(err.errors).map(val=>val.message)
       err.message = message,
       err.statusCode = 400
   }
   
    if(err.name === "CastError"){
       const error = new ErrorResponse(`Resource not found`,404)
        err.message = error.message
        err.statusCode = error.statusCode
    }
   
    res.status(err.statusCode||500)
    .json({
        success:false,
        error:err.message
    })
}


module.exports = errorHandler


