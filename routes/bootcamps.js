const express = require("express")
const router = express.Router()
const { protect,authorize } = require("../middleware/auth")
const {
    getBootcamps,
    getBootcamp,
    createBootcamp,
    updateBootcamp,
    deleteBootcamp,
    getBootcampsInRadius,
    uploadImage
} = require("../controllers/bootcamps")



router.route("/radius/:zipcode/:distance").get(getBootcampsInRadius)

router
.route("/")
.get(getBootcamps)
.post(protect,authorize('publisher',"admin"),createBootcamp)


router
.route("/:id")
.get(getBootcamp)
.delete(protect,authorize('publisher',"admin"),deleteBootcamp)
.put(protect,authorize('publisher',"admin"),updateBootcamp)

router.route("/:id/photo").put(protect,authorize('publisher',"admin"),uploadImage)

module.exports = router