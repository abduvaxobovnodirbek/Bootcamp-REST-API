const mongoose = require("mongoose")
const Schema = mongoose.Schema


const courseSchema = new Schema({
    title:{
        type:String,
        trim:true,
        required:[true,"Please add a course title"]
    },
    description:{
        type:String,
        required:[true,"Please add a description of course"]
    },
    weeks:{
        type:Number,
        required:[true,"Please add a number of weeks"]
    },
    tuition:{
        type:Number,
        required:[true,"Please add a tuition fee"]
    },
    minimumSkill:{
        type:String,
        required:[true,"Please add a minimum skill"],
        enum:["beginner","intermediate","advanced"]
    },
    scholarshipAvailable:{
        type:Boolean,
        default:false
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    bootcamp:{
        type:mongoose.Schema.ObjectId,
        required:true,
        ref:"Bootcamp"
    },
    user:{
        type:mongoose.Schema.ObjectId,
        required:true,
        ref:"User"
    }
})

// get average cost of courses through using aggregate 
courseSchema.statics.getAverageCost = async function(bootcampId){
  const obj =  await this.aggregate([
      {
          $match:{bootcamp:bootcampId}
      },
      {
        $group:{_id:"$bootcamp",averageCost:{$avg:"$tuition"}}
      }
  ])

  await this.model("Bootcamp").findByIdAndUpdate(bootcampId,{
      averageCost: Math.ceil(obj[0].averageCost/10)*10
  },{new:true})
}

//Call getAverageCost after save method
courseSchema.post("save", function () {
    this.constructor.getAverageCost(this.bootcamp)
})

//Call getAverageCost before remove method
courseSchema.pre("remove", function () {
    this.constructor.getAverageCost(this.bootcamp)
})



module.exports = mongoose.model("Course",courseSchema)