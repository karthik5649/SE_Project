const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    message_id: {
        type: String
    },
    message: {
        type: String
    },
    time: {
        type: String
    },
    sender: {
        type: String
    },
    sender_id: {
        type: String
    },
    status: {
        type: String,
        default: "pending"
    }
}, {"strict": "throw"})

const membersSchema = new mongoose.Schema({
    memberName: {
        type: String
    },
    member_id: {
        type: String
    },
    profileImgUrl: {
        type: String
    },
    joinedAt: {
        type: String,
        default: Date.now().toString()
    },
    isAdmin: {
        type: String,
        default: "no"
    }
}, {"strict": "throw"})

const groupSchema = new mongoose.Schema({
    group_id: {
        type: String
    },
    groupName: {
        type: String
    },
    creatorName: {
        type: String
    },
    creator_id: {
        type: String
    },
    members: [membersSchema],
    messages: [messageSchema],
    time: {
        type: String
    },
    description: {
        type: String
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    groupImage: {
        type: String,
        default: "https://via.placeholder.com/150"
    },
    tags: {
        type: [String],
        default: []
    }
}, {"strict": "throw"})

const Group = mongoose.model('groups', groupSchema)
module.exports = Group
