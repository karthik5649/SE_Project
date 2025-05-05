const exp = require("express")
const chatApp = exp.Router()
exports.chatApp = chatApp
const expressAsyncHandler = require("express-async-handler")
const { requireAuth } = require('@clerk/express')
require('dotenv').config()
const User = require('../Modals/userModel')
const Chat = require('../Modals/messageModal')

chatApp.get("/unauthorised", expressAsyncHandler(async (req, res) => {
    res.send({ message: "Unauthorised access . please signin to access" })
}))

chatApp.put("/checkChat", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const body = req.body
    let currentUser = { ...body[0] }
    let searchedUser = { ...body[1] }

    if (currentUser.userName === searchedUser.userName) {

        let chat = await User.find({ userName: currentUser.userName }, { chats: { $elemMatch: { userName: searchedUser.userName } } })

        if (chat[0].chats.length == 0) {

            let chatId = currentUser.userName +
                searchedUser.userName +
                Date.now()
            let currentUserChat = {
                chatId: chatId,
                userName: searchedUser.userName,
                profileImgUrl: searchedUser.profileImgUrl,
                time: Date.now(),
                firstName: searchedUser.firstName,
                lastName: searchedUser.lastName
            }
            let chat = {
                chatId: chatId,
                messages: [],
                time: Date.now(),
                isOnline: "no"
            }
            let newChat = new Chat(chat)
            let resChat = await newChat.save()
            let currentUserRes = await User.findOneAndUpdate(
                { userName: currentUser.userName },
                { $push: { chats: currentUserChat } },
                { returnOriginal: false }
            )
            chat = await User.find({ userName: currentUser.userName }, { chats: { $elemMatch: { userName: searchedUser.userName } } })
            res.send({ message: "you can chat with your self", indication: true, payload: [currentUserRes, resChat], chat: chat[0].chats[0] })

        } else {
            res.send({ message: "chat already exists", indication: true, payload: [currentUser, searchedUser], chat: chat[0].chats[0] })
        }

    } else {
        let chat = await User.find({ userName: currentUser.userName }, { chats: { $elemMatch: { userName: searchedUser.userName } } })

        if (chat[0].chats.length > 0) {

            res.send({ message: "chat already exists", indication: true, payload: [currentUser, searchedUser], chat: chat[0].chats[0] })

        } else if (chat[0].chats.length === 0) {

            if (searchedUser.accountType == 'public') {

                let chatId = currentUser.userName +
                    searchedUser.userName +
                    Date.now()
                let currentUserChat = {
                    chatId: chatId,
                    userName: searchedUser.userName,
                    profileImgUrl: searchedUser.profileImgUrl,
                    time: Date.now(),
                    firstName: searchedUser.firstName,
                    lastName: searchedUser.lastName
                }
                let searchedUserChat = {
                    chatId: chatId,
                    userName: currentUser.userName,
                    profileImgUrl: currentUser.profileImgUrl,
                    time: Date.now(),
                    firstName: currentUser.firstName,
                    lastName: currentUser.lastName
                }
                let chat = {
                    chatId: chatId,
                    messages: [],
                    time: Date.now(),
                    isOnline: "no"
                }
                let newChat = new Chat(chat)
                let resChat = await newChat.save()
                let currentUserRes = await User.findOneAndUpdate(
                    { userName: currentUser.userName },
                    { $push: { chats: currentUserChat } },
                    { returnOriginal: false }
                )
                let searchedUserRes = await User.findOneAndUpdate(
                    { userName: searchedUser.userName },
                    { $push: { chats: searchedUserChat } },
                    { returnOriginal: false }
                )
                chat = await User.find({ userName: currentUser.userName }, { chats: { $elemMatch: { userName: searchedUser.userName } } })
                res.send({ message: "account is public type", indication: true, payload: [currentUserRes, searchedUserRes, resChat], chat: chat[0].chats[0] })

            } else if (searchedUser.accountType === "private") {

                let user = await User.find({ userName: currentUser.userName }, { followers: { $elemMatch: { userName: searchedUser.userName } } })

                if (user[0].followers.length > 0) {

                    let searchedUser = user[0].followers[0]
                    let chatId = currentUser.userName +
                        searchedUser.userName +
                        Date.now()
                    let currentUserChat = {
                        chatId: chatId,
                        userName: searchedUser.userName,
                        profileImgUrl: searchedUser.profileImgUrl,
                        time: Date.now(),
                        firstName: searchedUser.firstName,
                        lastName: searchedUser.lastName
                    }
                    let searchedUserChat = {
                        chatId: chatId,
                        userName: currentUser.userName,
                        profileImgUrl: currentUser.profileImgUrl,
                        time: Date.now(),
                        firstName: currentUser.firstName,
                        lastName: currentUser.lastName
                    }
                    let chat = {
                        chatId: chatId,
                        messages: [],
                        time: Date.now(),
                        isOnline: "no"
                    }
                    let newChat = new Chat(chat)
                    let resChat = await newChat.save()
                    let currentUserRes = await User.findOneAndUpdate(
                        { userName: currentUser.userName },
                        { $push: { chats: currentUserChat } },
                        { returnOriginal: false }
                    )
                    let searchedUserRes = await User.findOneAndUpdate(
                        { userName: searchedUser.userName },
                        { $push: { chats: searchedUserChat } },
                        { returnOriginal: false }
                    )
                    chat = await User.find({ userName: currentUser.userName }, { chats: { $elemMatch: { userName: searchedUser.userName } } })
                    res.send({ message: "The user if following currentUser", indication: true, payload: [currentUserRes, searchedUserRes, resChat], chat: chat[0].chats[0] })

                } else {
                    res.send({ message: "You cannot chat with them untill they follow you", indication: false })
                }
            }
        }
    }
}))

chatApp.get("/getChat/:chatId", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    let chatId = req.params.chatId
    // console.log(chatId)
    let chat = await Chat.findOne({ chatId: chatId })
    // console.log(chat)
    res.send({ message: "Chat is available", payload: chat })
}))

chatApp.post("/message/:chatId", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    let chatId = req.params.chatId
    let message = req.body[0]
    let chat = await Chat.findOneAndUpdate(
        { chatId: chatId },
        { $push: { messages: message } },
        { returnOriginal: false }
    )
    res.send({ message: true, payload: chat })
}))

chatApp.put("/delete/", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    let [chatId,messageId] = req.body
    let chat = await Chat.findOneAndUpdate(
        { chatId: chatId },
        { $pull: { messages: {messageId : messageId} } },
        { returnOriginal: false }
    )
    res.send({ message: true, payload: chat })
}))

module.exports = chatApp
