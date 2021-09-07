const Course  = require("../models/Course")
const ErrorResponse = require("../utils/errorResponse")
const asyncHandler = require("../middleware/async")
const Bootcamp = require("../models/Bootcamp")



// @desc  Get all courses
// @route GET /api/v1/courses
// @access PUBLIC
exports.getCourses = asyncHandler(async (req,res,next)=>{

    let query;
    //copying req.query
    let reqQuery = {...req.query}
   //selecting words to not consider as query
    let removeFields = ['select','sort',"limit","page"]
   // removing selected queries
    removeFields.forEach(param=>delete reqQuery[param])
   //changing query to string
    let queryStr = JSON.stringify(reqQuery)
    //adding mongoose parameter $gt,$lte etc
    queryStr = queryStr.replace(/\b(gt|lt|lte|gte|in)\b/g,match=>`$${match}`)
    
    query = Course.find(JSON.parse(queryStr)).populate({
        path:"bootcamp",
        select:"name description"
    })

    //selecting 
    if(req.query.select){
          const fields = req.query.select.split(",").join(" ")
          query = query.select(fields)  
    }
    //sorting
    if(req.query.sort){
          const sortBy = req.query.sort.split(",").join(" ")
          query = query.sort(sortBy)  
    }else{
            query = query.sort("-createdAt")
    }
    //pagination
    const limit = Number(req.query.limit) || 1
    const page = Number(req.query.page) || 1 
    let pagination = {};
    let total = await Course.find(JSON.parse(queryStr)).countDocuments()

    if(page>=1){
            pagination = {next:page+1}
    }

    if(page<total){
            pagination = {next:page+1,prev:page-1}
    }

    if(page === total){
            pagination = {prev:page-1}
    }

 
    const courses = await query.skip((page-1)*limit).limit(limit)

    res.status(200).json({success:true,count:courses.length,data:courses})
})

// @desc  Get all courses of one Bootcamp
// @route GET /api/v1/courses/bootcampId/courses
// @access PUBLIC
exports.getCoursesById = asyncHandler(async (req,res,next)=>{
    const {bootcampId} = req.params
    const courses =  await Course.find({bootcamp:bootcampId}).populate({
        path:"bootcamp",
        select:"name description"
    })
    
    if(courses.length<=0){
       return next(new ErrorResponse(`Resource not found with id of ${bootcampId}`,404))
    }
    res.status(200).json({success:true,count:courses.length,data:courses})
})




// @desc  Get single course
// @route GET /api/v1/courses/id
// @access PUBLIC
exports.getCourse = asyncHandler(async (req,res,next)=>{
    const {id} = req.params
    const course =  await Course.findById(id).populate({
        path:"bootcamp",
        select:"name description"
    })
    
    if(!course){
       return next(new ErrorResponse(`Resource not found with id of ${id}`,404))
    }
    res.status(200).json({success:true,data:course})
})



// @desc  Create course
// @route POST /api/v1/courses/bootcamps/bootcampId/course
// @access PRIVATE
exports.createCourse = asyncHandler(async (req,res,next)=>{
    const {bootcampId} = req.params
    req.body.bootcamp =  bootcampId
    req.body.user = req.user._id

    const FoundBootcamp = await Bootcamp.findById(bootcampId)

    if(!FoundBootcamp){
        return next(new ErrorResponse(`you can not create Course with id of ${bootcampId}`,403))
    }

    if(FoundBootcamp.user.toString() !== req.user._id.toString()){
        return next(new ErrorResponse(`you can not create Course with id of ${bootcampId}`,403))
    }

    const newCourse = await Course.create(req.body)
    
    res.status(200).json({success:true,data:newCourse})
    
})




// @desc  Update course
// @route PUT /api/v1/courses/:id
// @access PRIVATE
exports.updateCourse = asyncHandler(async (req,res,next)=>{
    const {id} = req.params
    
    const course = await Course.findById(id)

    if(!course){
        return next(new ErrorResponse(`you can not update Course with id of ${id}`,403))
    }
    
    if(req.user._id.toString() !==course.user.toString()){
        return next(new ErrorResponse(`you can not update Course with id of ${id}`,403))
    }

    const updatedCourse = await Course.findByIdAndUpdate(id,req.body,{new:true})
    
    res.status(200).json({success:true,data:updatedCourse})
    
})


// @desc  Delete course
// @route DELETE /api/v1/courses/:id
// @access PRIVATE
exports.deleteCourse = asyncHandler(async (req,res,next)=>{
    const {id} = req.params
    
    const course = await Course.findById(id)

    if(!course){
        return next(new ErrorResponse(`you can not delete Course with id of ${id}`,403))
    }

    if(req.user._id.toString() !== course.user.toString()){
        return next(new ErrorResponse(`you can not delete Course with id of ${id}`,403))
    }

    await course.remove()
    
    res.status(200).json({success:true})
    
})


