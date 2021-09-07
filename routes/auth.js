const express  = require("express")
const router = express.Router()
const {register,login,getMe,forgotpassword, resetpassword, postNewPassword}  = require("../controllers/auth")
const { protect } = require("../middleware/auth")


router.post("/register",register)
router.post("/login",login)
router.get("/me",protect,getMe)

router.post("/forgotpassword",forgotpassword)
router.get("/resetpassword/:token",resetpassword)
router.post("/resetpassword/:token",postNewPassword)


module.exports = router