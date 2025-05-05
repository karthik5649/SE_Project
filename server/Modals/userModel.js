const mongoose = require('mongoose')

const followSchema = new mongoose.Schema({
    userName : {
        type : String
    },profileImgUrl : {
        type:String
    },firstName:{
        type : String,
    },lastName:{
        type : String,
    }
},{"strict":"throw"})

const chatSchema = new mongoose.Schema({
    chatId : {
        type : String
    },userName:{
        type : String
    },profileImgUrl:{
        type : String
    },time:{
        type : String
    },firstName:{
        type : String,
    },lastName:{
        type : String,
    },block:{
        type : Boolean,
        default : false
    }
},{"strict":"throw"})

// Education schema
const educationSchema = new mongoose.Schema({
    institution: {
        type: String
    },
    degree: {
        type: String
    },
    fieldOfStudy: {
        type: String
    },
    startDate: {
        type: String
    },
    endDate: {
        type: String
    },
    description: {
        type: String
    }
}, {"strict":"throw"})

// Experience schema
const experienceSchema = new mongoose.Schema({
    company: {
        type: String
    },
    position: {
        type: String
    },
    location: {
        type: String
    },
    startDate: {
        type: String
    },
    endDate: {
        type: String
    },
    description: {
        type: String
    }
}, {"strict":"throw"})

// Skill schema
const skillSchema = new mongoose.Schema({
    name: {
        type: String
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
        default: 'Intermediate'
    }
}, {"strict":"throw"})

const userSchema = new mongoose.Schema({
    userName : {
        type : String,
        required : true,
        unique : true
    },
    email:{
        type : String,
        required : true,
        unique : true
    },
    password:{
        type : String
    },
    bio:{
        type : String
    },
    profileImgUrl:{
        type : String
    },
    phoneNumber:{
        type : String,
        required : true
    },
    firstName:{
        type : String,
        required : true
    },
    lastName:{
        type : String,
        required : true
    },
    headline: {
        type: String
    },
    location: {
        type: String
    },
    education: [educationSchema],
    experience: [experienceSchema],
    skills: [skillSchema],
    resumeUrl: {
        type: String
    },
    website: {
        type: String
    },
    followers:[followSchema],
    following:[followSchema],
    accountType : {
        type : String,
        required : true
    },
    chats:[chatSchema]
},{"strict":"throw"})

const User = mongoose.model('users',userSchema)
module.exports = User
