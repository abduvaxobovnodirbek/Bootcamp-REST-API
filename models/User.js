const mongoose = require("mongoose")
const Schema = mongoose.Schema
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const dotenv = require("dotenv")

dotenv.config()

const userSchema = new Schema({
    name:{
        type:String,
        required:[true,"Please add a name"],
        unique:true
    },
    email:{
        type:String,
        match: [/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/, "Please add a valid email"]
    },
    password:{
        type:String,
        required:[true,"Please add a password"],
        minlength:6
    },
    role:{
        type:String,
        enum:["user","publisher","admin"],
        default:"user"
    },
    resetPasswordToken:String,
    resetPasswordExpire:Date,
    createdAt:{
        type:Date,
        default:Date.now
    }
})


userSchema.methods.getTokenByRegister = function(){
    return jwt.sign({id:this._id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRE})
}

userSchema.methods.matchPassword = async function(enteredPassword){
    const isMatch = await bcrypt.compare(enteredPassword,this.password)
    return isMatch
}


userSchema.pre("save", async function(next){
    let salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password,salt)
    next()
})


module.exports = mongoose.model("User",userSchema)