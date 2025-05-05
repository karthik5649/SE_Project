const exp = require('express')
const userApp = exp.Router()
const expressAsyncHandler = require("express-async-handler")
const { requireAuth } = require('@clerk/express')
require('dotenv').config()
const User = require('../Modals/userModel')
const Chat = require('../Modals/messageModal')
const upload = require('../utils/fileUpload')
const path = require('path')
const fs = require('fs')

// unauthorised
userApp.get("/unauthorised", expressAsyncHandler(async (req, res) => {
    res.send({ message: "Unauthorised access . please signin to access" })
}))

// to check wheather user available or not
userApp.get("/user/:email", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const email = req.params.email
    // console.log(email)
    const user = await User.find({ email: email })
    // console.log(user)
    if (user.length != 0) {
        // console.log(user)
        res.status(200).send({ message: "User exists", payload: user })
    } else {
        res.send({ message: "User does not exist" })
    }
}))

// to check wheather username available or not and sends user
userApp.get("/userName/:userName", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const userName = req.params.userName
    // console.log(userName)
    const user = await User.find({ userName: userName })
    // console.log(user)
    if (user.length == 0) {
        res.send({ message: true, err: "User not present" })
    } else {
        res.send({ message: false, payload: user })
    }
}))

// post user
userApp.post("/user", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const newUser = req.body
    // console.log(newUser)
    const user = await User.findOne({ userName: newUser.userName })
    console.log(user)
    if (user === null) {
        let newUserObj = new User(newUser)
        let userBody = await newUserObj.save()
        res.status(200).send({ message: "user successfully created", payload: userBody })
    }
}))

// get users
userApp.get("/users", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const allUsers = await User.find()
    res.send({ message: "All the users", payload: allUsers })
}))

// update followers
userApp.put("/follow", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const body = req.body

    let currentUser = { ...body[0] }
    let selectedUser = { ...body[1] }

    // console.log(currentUser)
    // console.log(selectedUser)

    let followers = {
        userName: currentUser.userName,
        profileImgUrl: currentUser.profileImgUrl,
        firstName: currentUser.firstName,
        lastName: currentUser.lastName
    }

    let following = {
        userName: selectedUser.userName,
        profileImgUrl: selectedUser.profileImgUrl,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName
    }

    // console.log(followers)
    // console.log(following)

    let currentUserRes = await User.findOneAndUpdate(
        { userName: currentUser.userName },
        { $push: { following: following } },
        { returnOriginal: false }
    )
    let selectedUserRes = await User.findOneAndUpdate(
        { userName: selectedUser.userName },
        { $push: { followers: followers } },
        { returnOriginal: false }
    )
    // console.log(currentUserRes,selectedUserRes)
    res.send({ message: true, payload: [currentUserRes, selectedUserRes] })

}))

// unfollow followers
userApp.put("/unfollow", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const body = req.body
    let currentUser = { ...body[0] }
    let selectedUser = { ...body[1] }
    // console.log(currentUser)
    // console.log(selectedUser)
    let currentUserRes = await User.findOneAndUpdate(
        { userName: currentUser.userName },
        { $pull: { following: { userName: selectedUser.userName } } },
        { returnOriginal: false }
    )
    let selectedUserRes = await User.findOneAndUpdate(
        { userName: selectedUser.userName },
        { $pull: { followers: { userName: currentUser.userName } } },
        { returnOriginal: false }
    )
    // console.log(currentUserRes)
    // console.log(selectedUserRes)
    res.send({ message: true, payload: [currentUserRes, selectedUserRes] })
}))

// creating chat
userApp.post("/chat", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const body = req.body
    let currentUser = { ...body[0] }
    let selectedUser = { ...body[1] }
    let chatId = currentUser.userName +
        selectedUser.userName +
        Date.now()
    let currentUserChat = {
        chatId: chatId,
        userName: selectedUser.userName,
        profileImgUrl: selectedUser.profileImgUrl,
        time: Date.now(),
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName
    }
    let selectedUserChat = {
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
    let user
    if (currentUser.chats.length > 0) {
        user = await User.find({ userName: currentUser.userName }, { chats: { $elemMatch: { userName: selectedUser.userName } } })
        // console.log(user)
        if (user[0].chats.length == 0) {
            let newChat = new Chat(chat)
            let resChat = await newChat.save()
            let currentUserRes = await User.findOneAndUpdate(
                { userName: currentUser.userName },
                { $push: { chats: currentUserChat } },
                { returnOriginal: false }
            )
            let selectedUserRes = await User.findOneAndUpdate(
                { userName: selectedUser.userName },
                { $push: { chats: selectedUserChat } },
                { returnOriginal: false }
            )
            res.send({ message: true, payload: [currentUserRes, selectedUserRes, resChat] })
        } else {
            let oldChatId = user[0].chats[0].chatId
            // console.log(oldChatId)
            let oldChat = await Chat.find({ chatId: oldChatId })
            res.send({ message: true, payload: [currentUser, selectedUser, oldChat] })
        }
    } else {
        let newChat = new Chat(chat)
        let resChat = await newChat.save()
        let currentUserRes = await User.findOneAndUpdate(
            { userName: currentUser.userName },
            { $push: { chats: currentUserChat } },
            { returnOriginal: false }
        )
        let selectedUserRes = await User.findOneAndUpdate(
            { userName: selectedUser.userName },
            { $push: { chats: selectedUserChat } },
            { returnOriginal: false }
        )
        res.send({ message: true, payload: [currentUserRes, selectedUserRes, resChat] })
    }
}))

// Serve static files from uploads directory
userApp.use('/uploads', exp.static(path.join(__dirname, '../uploads')));

// Update basic profile information
userApp.put("/profile/basic", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        const { userName, firstName, lastName, headline, bio, location, website, phoneNumber } = req.body;

        // Find and update the user
        const updatedUser = await User.findOneAndUpdate(
            { userName: userName },
            {
                firstName,
                lastName,
                headline,
                bio,
                location,
                website,
                phoneNumber
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send({ message: "Profile updated successfully", payload: updatedUser });
    } catch (error) {
        res.status(500).send({ message: "Error updating profile", error: error.message });
    }
}));

// Upload profile image
userApp.post("/profile/image", requireAuth({ signInUrl: "unauthorize" }), upload.single('profileImage'), expressAsyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded" });
        }

        const { userName } = req.body;

        // Create URL for the uploaded file
        const fileUrl = `http://localhost:3000/userApp/uploads/${req.file.filename}`;

        // Update user's profile image URL
        const updatedUser = await User.findOneAndUpdate(
            { userName: userName },
            { profileImgUrl: fileUrl },
            { new: true }
        );

        if (!updatedUser) {
            // Delete the uploaded file if user not found
            fs.unlinkSync(req.file.path);
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send({
            message: "Profile image updated successfully",
            payload: updatedUser
        });
    } catch (error) {
        res.status(500).send({ message: "Error uploading profile image", error: error.message });
    }
}));

// Upload resume
userApp.post("/profile/resume", requireAuth({ signInUrl: "unauthorize" }), upload.single('resume'), expressAsyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send({ message: "No file uploaded" });
        }

        const { userName } = req.body;

        // Create URL for the uploaded file
        const fileUrl = `http://localhost:3000/userApp/uploads/${req.file.filename}`;

        // Update user's resume URL
        const updatedUser = await User.findOneAndUpdate(
            { userName: userName },
            { resumeUrl: fileUrl },
            { new: true }
        );

        if (!updatedUser) {
            // Delete the uploaded file if user not found
            fs.unlinkSync(req.file.path);
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send({
            message: "Resume uploaded successfully",
            payload: updatedUser
        });
    } catch (error) {
        res.status(500).send({ message: "Error uploading resume", error: error.message });
    }
}));

// Add education
userApp.post("/profile/education", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        const { userName, education } = req.body;

        // Add education to user's profile
        const updatedUser = await User.findOneAndUpdate(
            { userName: userName },
            { $push: { education: education } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send({
            message: "Education added successfully",
            payload: updatedUser
        });
    } catch (error) {
        res.status(500).send({ message: "Error adding education", error: error.message });
    }
}));

// Update education
userApp.put("/profile/education/:index", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        const { userName, education } = req.body;
        const index = parseInt(req.params.index);

        // Find the user
        const user = await User.findOne({ userName: userName });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        // Update the education at the specified index
        if (index >= 0 && index < user.education.length) {
            user.education[index] = education;
            await user.save();

            res.status(200).send({
                message: "Education updated successfully",
                payload: user
            });
        } else {
            res.status(400).send({ message: "Invalid education index" });
        }
    } catch (error) {
        res.status(500).send({ message: "Error updating education", error: error.message });
    }
}));

// Delete education
userApp.delete("/profile/education/:index", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        const { userName } = req.body;
        const index = parseInt(req.params.index);

        // Find the user
        const user = await User.findOne({ userName: userName });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        // Remove the education at the specified index
        if (index >= 0 && index < user.education.length) {
            user.education.splice(index, 1);
            await user.save();

            res.status(200).send({
                message: "Education deleted successfully",
                payload: user
            });
        } else {
            res.status(400).send({ message: "Invalid education index" });
        }
    } catch (error) {
        res.status(500).send({ message: "Error deleting education", error: error.message });
    }
}));

// Add experience
userApp.post("/profile/experience", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        const { userName, experience } = req.body;

        // Add experience to user's profile
        const updatedUser = await User.findOneAndUpdate(
            { userName: userName },
            { $push: { experience: experience } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send({
            message: "Experience added successfully",
            payload: updatedUser
        });
    } catch (error) {
        res.status(500).send({ message: "Error adding experience", error: error.message });
    }
}));

// Update experience
userApp.put("/profile/experience/:index", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        const { userName, experience } = req.body;
        const index = parseInt(req.params.index);

        // Find the user
        const user = await User.findOne({ userName: userName });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        // Update the experience at the specified index
        if (index >= 0 && index < user.experience.length) {
            user.experience[index] = experience;
            await user.save();

            res.status(200).send({
                message: "Experience updated successfully",
                payload: user
            });
        } else {
            res.status(400).send({ message: "Invalid experience index" });
        }
    } catch (error) {
        res.status(500).send({ message: "Error updating experience", error: error.message });
    }
}));

// Delete experience
userApp.delete("/profile/experience/:index", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        const { userName } = req.body;
        const index = parseInt(req.params.index);

        // Find the user
        const user = await User.findOne({ userName: userName });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        // Remove the experience at the specified index
        if (index >= 0 && index < user.experience.length) {
            user.experience.splice(index, 1);
            await user.save();

            res.status(200).send({
                message: "Experience deleted successfully",
                payload: user
            });
        } else {
            res.status(400).send({ message: "Invalid experience index" });
        }
    } catch (error) {
        res.status(500).send({ message: "Error deleting experience", error: error.message });
    }
}));

// Add skill
userApp.post("/profile/skill", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        const { userName, skill } = req.body;

        // Add skill to user's profile
        const updatedUser = await User.findOneAndUpdate(
            { userName: userName },
            { $push: { skills: skill } },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).send({ message: "User not found" });
        }

        res.status(200).send({
            message: "Skill added successfully",
            payload: updatedUser
        });
    } catch (error) {
        res.status(500).send({ message: "Error adding skill", error: error.message });
    }
}));

// Update skill
userApp.put("/profile/skill/:index", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        const { userName, skill } = req.body;
        const index = parseInt(req.params.index);

        // Find the user
        const user = await User.findOne({ userName: userName });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        // Update the skill at the specified index
        if (index >= 0 && index < user.skills.length) {
            user.skills[index] = skill;
            await user.save();

            res.status(200).send({
                message: "Skill updated successfully",
                payload: user
            });
        } else {
            res.status(400).send({ message: "Invalid skill index" });
        }
    } catch (error) {
        res.status(500).send({ message: "Error updating skill", error: error.message });
    }
}));

// Delete skill
userApp.delete("/profile/skill/:index", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        const { userName } = req.body;
        const index = parseInt(req.params.index);

        // Find the user
        const user = await User.findOne({ userName: userName });

        if (!user) {
            return res.status(404).send({ message: "User not found" });
        }

        // Remove the skill at the specified index
        if (index >= 0 && index < user.skills.length) {
            user.skills.splice(index, 1);
            await user.save();

            res.status(200).send({
                message: "Skill deleted successfully",
                payload: user
            });
        } else {
            res.status(400).send({ message: "Invalid skill index" });
        }
    } catch (error) {
        res.status(500).send({ message: "Error deleting skill", error: error.message });
    }
}));

module.exports = userApp;
