const Bootcamp  = require("../models/Bootcamp")
const ErrorResponse = require("../utils/errorResponse")
const asyncHandler = require("../middleware/async")
const geocoder = require("../utils/geocoder")
const fs = require("fs")
const path = require("path")

// @desc  Get all bootcamps
// @route GET /api/v1/bootcamps
// @access PUBLIC
exports.getBootcamps = asyncHandler(async (req,res,next)=>{
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
        
        query = Bootcamp.find(JSON.parse(queryStr)).populate("course")
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
        let total = await Bootcamp.find(JSON.parse(queryStr)).countDocuments()

        if(page>=1){
                pagination = {next:page+1}
        }

        if(page<total){
                pagination = {next:page+1,prev:page-1}
        }

        if(page === total){
                pagination = {prev:page-1}
        }

     
        const bootcamps = await query.skip((page-1)*limit).limit(limit)
        
        res.status(200).json({success:true,pagination,count:bootcamps.length,data:bootcamps})
    
})



// @desc  Get single bootcamp
// @route GET /api/v1/bootcamps/:id
// @access PUBLIC
exports.getBootcamp = asyncHandler(async (req,res,next)=>{
   
       const bootcamp = await Bootcamp.findById(req.params.id).populate("course")
       
       if(!bootcamp){
        return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`,404))
       }

       res.status(200).json({success:true,data:bootcamp})
   
})




// @desc  Create bootcamp
// @route POST /api/v1/bootcamps/
// @access PRIVATE
exports.createBootcamp = asyncHandler(async (req,res,next)=>{
       
        req.body.user = req.user._id

        const bootcampPublisher = await Bootcamp.findOne({user:req.user._id})
        
        if(bootcampPublisher && req.body.role !== "admin"){
        return next(new ErrorResponse(`you can not create bootcamp with id of ${req.body.user}`,403))
        }

        let bootcamp = await Bootcamp.create(req.body)
        res.status(201).json({success:true,data:bootcamp})
    
})





// @desc  Update bootcamp
// @route PUT /api/v1/bootcamps/:id
// @access PRIVATE
exports.updateBootcamp = asyncHandler(async(req,res,next)=>{
       
        let updatedBootcamp = await Bootcamp.findByIdAndUpdate(req.params.id,{$set:req.body},{new:true}) 
        
        if(!updatedBootcamp){
            return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`,404))
        } 

        if(req.user._id.toString() !== updatedBootcamp.user.toString()){
                return next(new ErrorResponse(`you can not update others bootcamp`,403))
        }

        res.status(200).json({success:true,data:updatedBootcamp})
    
})



// @desc  Upload bootcamp Photo
// @route PUT /api/v1/bootcamps/:id/photo
// @access PRIVATE
exports.uploadImage = asyncHandler(async(req,res,next)=>{

        let updatedBootcamp = await Bootcamp.findByIdAndUpdate(req.params.id,{photo:req.file?.filename},{new:true}) 
        
        if(!updatedBootcamp){
            return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`,404))
        } 

        if(req.user._id.toString() !== updatedBootcamp.user.toString()){
            return next(new ErrorResponse(`you can not upload others photo`,403))
        }

        res.status(200).json({success:true,data:updatedBootcamp})
    
})




// @desc  Delete bootcamp
// @route DELETE /api/v1/bootcamps/:id
// @access PRIVATE
exports.deleteBootcamp = asyncHandler(async (req,res,next)=>{
        
        let deleteBootcamp = await Bootcamp.findById(req.params.id) 

        if(!deleteBootcamp){
            return next(new ErrorResponse(`Resource not found with id of ${req.params.id}`,404))
        }

        if(req.user._id.toString() !== deleteBootcamp.user.toString()){
           return next(new ErrorResponse(`you can not delete others bootcamp`,403))
        }

        fs.unlink(path.join("public","images",deleteBootcamp.photo),err=>{
                console.log(err,"from errror");
        })

        await deleteBootcamp.remove()

        res.status(200).json({success:true})
        
})



// @desc  Get bootcamps within a radius
// @route GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access PRIVATE
exports.getBootcampsInRadius = asyncHandler(async (req,res,next)=>{
        const {zipcode,distance} = req.params
        const location = await geocoder.geocode(zipcode)
        const latitude = location[0].latitude;
        const longitude = location[0].longitude

        //calc radius using radians
        //divide distance by radius of earth
        // earth radius = 6 371km
        const radius = distance / 3958

        const bootcamps = await Bootcamp.find({
                location:{
                        $geoWithin: { $centerSphere: [ [ longitude, latitude ], radius ] }
                }
        })

        res.status(200).json({success:true,count:bootcamps.length,data:bootcamps})

})