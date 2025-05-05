const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    messageId:{
        type:String,
        required:true
    },senderUserName : {
        type:String,
        required:true
    },message:{
        type:String
    },day : {
        type:String
    },time:{
        type:String
    },status:{
        type:String,
        default:"pending"
    }
},{"strict":"throw"})

const chatSchema = new mongoose.Schema({
    chatId:{
        type:String
    },
    messages:[messageSchema]
    ,time:{
        type:String
    },isOnline:{
        type:String,
        default:"no"
    }
},{"strict":"throw"})

const Chat = mongoose.model('chat', chatSchema)
module.exports = Chat
