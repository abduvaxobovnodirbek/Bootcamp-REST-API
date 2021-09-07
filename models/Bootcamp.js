const mongoose = require("mongoose")
const Schema = mongoose.Schema
const slugify = require("slugify")
const geocoder = require("../utils/geocoder")

const bootcampSchema = new Schema({
    name: {
        required: [true, "Please add a name"],
        type: String,
        maxlength: [50, "Name can not be more than 50 characters"],
        unique: true,
        trim: true
    },
    slug: String,
    description: {
        required: [true, "Please add a description"],
        type: String,
        maxlength: [500, "Description can not be more than 500 characters"]
    },
    website: {
        type: String,
        match: [/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/, "Please use a valid URL with HTTP or HTTPS"]
    },
    phoneNumber: {
        type: String,
        maxLength: [20, "Phone number can not be longer than 20 characters"]
    },
    email: {
        type: String,
        match: [/^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/, "Please add a valid email"]
    },
    address: {
        type: String,
        required: [true, "Please add an address"]
    },
    location: {
        //GeoJson POINT
        type: {
            type: String,
            enum: ['Point'],
        },
        coordinates: {
            type: [Number],
            index: "2dsphere"
        },
        formattedAddress: String,
        street: String,
        city: String,
        state: String,
        zipcode: String,
        country: String
    },
    careers: {
        //Array of strings
        type: [String],
        required: true,
        enum: [
            'Web Development',
            'Mobile Development',
            'UI/UX',
            'Data Science',
            'Business',
            'Others'
        ]
    },
    averageRating: {
        type: Number,
        min: [1, 'Rating must be at least 1'],
        max: [10, 'Rating can not be more than 10']
    },
    averageCost: Number,
    photo: {
        type: String,
        default: 'no-photo.jpg'
    },
    housing: {
        type: Boolean,
        default: false
    },
    jobAssistance: {
        type: Boolean,
        default: false
    },
    jobGuarantee: {
        type: Boolean,
        default: false
    },
    acceptGi: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    user:{
        type:mongoose.Schema.ObjectId,
        required:true,
        ref:"User"
    }

},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})

bootcampSchema.pre("save",function(next){
    this.slug = slugify(this.name,{lower:true})
    next()
})


//Geocode & create location field

bootcampSchema.pre("save", async function(next){
    const loc = await geocoder.geocode(this.address)
    this.location = {
        type:"Point",
        coordinates:[loc[0].longitude,loc[0].latitude],
        formattedAddress: loc[0].formattedAddress,
        street: loc[0].streetName,
        city: loc[0].city,
        state: loc[0].stateCode,
        zipcode: loc[0].zipcode,
        country:loc[0].countryCode

    }
   this.address = undefined
    next()
})

// Cascade delete courses when a bootcamp is deleted
bootcampSchema.pre("remove", async function(next){
   await this.model("Course").deleteMany({bootcamp:this._id})
   next()
})


// Reverse populate with virtuals
bootcampSchema.virtual("course",{
    ref:"Course",
    localField:"_id",
    foreignField:"bootcamp",
    justOne:false
})

module.exports = mongoose.model("Bootcamp", bootcampSchema)