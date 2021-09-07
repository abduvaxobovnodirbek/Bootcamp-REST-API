const User  = require("../models/User")
const ErrorResponse = require("../utils/errorResponse")
const asyncHandler = require("../middleware/async")
const nodemailer = require("nodemailer");
const dotenv = require("dotenv")
const crypto = require("crypto")
const bcrypt = require("bcryptjs")

dotenv.config()

// @desc  Post register user
// @route POST /api/v1/auth/register
// @access PUBLIC

exports.register = asyncHandler(async(req,res,next)=>{
    const {name,role,email,password} = req.body

    const existingUser = await User.findOne({email:email})
    if(existingUser){
        return next(new ErrorResponse("entered email address already exists,try with another one",403))
    }
    const user = await User.create({name,role,email,password})
    
    const token = user.getTokenByRegister()
    
    res.status(200).cookie('token',token,{expires:new Date(Date.now()+30*3600*24*1000),httpOnly:true}).json({success:true,token,data:user})
})



// @desc  Post login user
// @route POST /api/v1/auth/login
// @access PUBLIC

exports.login = asyncHandler(async(req,res,next)=>{
    const {email,password} = req.body
    
    if(!email||!password){
        return next(new ErrorResponse("please add an email and password",401))
    }

    const existingUser = await User.findOne({email:email})
   
    if(!existingUser){
        return next(new ErrorResponse("invalid credentials",401))
    }
  
    const match = await existingUser.matchPassword(password)

    if(!match){
        return next(new ErrorResponse("invalid credentials",401))
    }

    const token = existingUser.getTokenByRegister()
    
    res.status(200).cookie('token',token,{expires:new Date(Date.now()+30*3600*24*1000),httpOnly:true}).json({success:true,token,data:existingUser})
})



exports.getMe = asyncHandler(async(req,res,next)=>{
     const user = await User.findById(req.user.id)
     if(!user){
        return next(new ErrorResponse("no user found",404))
     }
     res.json(user)
})

exports.forgotpassword = asyncHandler(async(req,res,next)=>{
    const {email} = req.body

    const existingUser = await User.findOne({email:email})
    if(!existingUser){
        return next(new ErrorResponse(`no user found with ${email}`,404))
    }

    const transporter = nodemailer.createTransport({
        service:process.env.SMTP_SERVICE,
        auth:{
            user:process.env.SMTP_USER,
            pass:process.env.SMTP_PASS
        }
    })
    
    const randomToken = await crypto.randomBytes(10).toString("hex")
    
    existingUser.resetPasswordToken = randomToken
    existingUser.resetPasswordExpire = Date.now()+7200000
    
    existingUser.save()
    
    await transporter.sendMail({
        from: '"noreply@devCamper.com', // sender address
        to: `${email}`, // list of receivers
        subject: "Reset Password ✔", // Subject line
        html: `<h4>Please click this <a href = 'http://localhost:5000/api/v1/auth/resetpassword/${randomToken}'}>link</a> to reset your current password</h4>`, // html body
      });
    
    res.status(200).json({success:true,message:"please check your email to reset password"})
})


exports.resetpassword = asyncHandler(async(req,res,next)=>{
    const {token} = req.params
    const user =  await User.findOne({resetPasswordToken:token, resetPasswordExpire:{$gt:Date.now()}})
    res.status(200).json({success:true,data:user._id})
})

exports.postNewPassword = asyncHandler(async(req,res,next)=>{
    const {password,id} = req.body
    const user =  await User.findById(id)
    
    if(!user){
        return next(new ErrorResponse("no user found",401))
    }
    
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password,salt)
    
    const updatedUser = await User.findByIdAndUpdate(id,{
        password:hashedPassword,
        resetPasswordExpire:undefined,
        resetPasswordToken:undefined
    },{new:true})
    
  if(!updatedUser){
    return next(new ErrorResponse("no user found with that id",404))
  }

    res.status(200).json({success:true,data:updatedUser})

})