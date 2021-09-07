const express = require("express")
const dotenv = require("dotenv")
const mongoose = require("mongoose")
const morgan = require("morgan")
const colors = require("colors")
const multer = require("multer")
const app = express()
const errors = require("./middleware/error")
const crypto = require("crypto")
const cookieParser = require("cookie-parser")
const mongoSanitize = require("express-mongo-sanitize")
const helmet = require("helmet")
const xss = require("xss-clean")
const cors = require("cors")

//routes
const bootcampsRoutes = require("./routes/bootcamps")
const coursesRoutes = require("./routes/courses")
const authRoutes = require("./routes/auth")

//configuration
dotenv.config()
app.use(morgan("dev"))
app.use(express.json())
app.use(cookieParser())
app.use(mongoSanitize())
app.use(helmet())
app.use(xss())
app.use(cors())


const PORT = process.env.PORT || 5000
const URL = process.env.MONGO_URL

app.use(express.static("public"))

//configuring multer to upload files
const fileStorage = multer.diskStorage({
    destination:(req,file,cb)=>{
       cb(null,"./public/images")
    },
    filename:(req,file,cb)=>{
       cb(null,crypto.randomBytes(5).toString("hex") + file.originalname)
    }
})

const fileFilter = (req,file,cb)=>{
 if(file.mimetype === "image/png" ||file.mimetype === "image/jpg" ||file.mimetype === "image/jpeg"){
     cb(null,true)
  }else{
      cb(null,false)
  }
}

app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single("image"))

//using routes
app.use("/api/v1/bootcamps", bootcampsRoutes)
app.use("/api/v1/courses", coursesRoutes)
app.use("/api/v1/auth", authRoutes)

//error handling
app.use(errors)

//connecting to database
mongoose.connect(URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        app.listen(PORT, () => {
            console.log(`backend is running on PORT ${PORT}`.cyan.bold);
        })
    })
    .catch(err => {
        console.log("something went wrong with connection to database".red.bold);
    })