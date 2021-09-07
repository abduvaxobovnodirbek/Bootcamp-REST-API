const express = require("express")
const router = express.Router()
const {
    getCourses,
    getCoursesById,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse
} = require("../controllers/courses")

const { protect,authorize } = require("../middleware/auth")

router.route("/")
.get(getCourses)

router.route("/:id")
.get(getCourse)
.put(protect,authorize('publisher',"admin"),updateCourse)
.delete(protect,authorize('publisher',"admin"),deleteCourse)

router.route("/:bootcampId/courses")
.get(getCoursesById)


router.route("/bootcamps/:bootcampId/courses")
.post(protect,authorize('publisher',"admin"),createCourse)


module.exports = router