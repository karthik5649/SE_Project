const exp = require("express");
const communityApp = exp.Router();
const expressAsyncHandler = require("express-async-handler");
const { requireAuth } = require('@clerk/express');
require('dotenv').config();
const User = require('../Modals/userModel');
const Group = require('../Modals/groupModal');

// Get unauthorized message
communityApp.get("/unauthorised", expressAsyncHandler(async (req, res) => {
    res.send({ message: "Unauthorised access. Please signin to access" });
}));

// Create a new community
communityApp.post("/create", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    try {
        console.log("Received create community request:", req.body);
        const communityData = req.body;
        const { groupName, creatorName, creator_id, description, tags } = communityData;

        if (!groupName || !creatorName || !creator_id) {
            return res.status(400).send({
                message: "Missing required fields: groupName, creatorName, or creator_id"
            });
        }

        // Create a unique group ID
        const group_id = `community_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        // Create the initial member (creator as admin)
        const initialMember = {
            memberName: creatorName,
            member_id: creator_id,
            isAdmin: "yes"
        };

        // Create the community object
        const newCommunity = {
            group_id,
            groupName,
            creatorName,
            creator_id,
            description,
            members: [initialMember],
            messages: [],
            time: Date.now().toString(),
            tags: tags || []
        };

        console.log("Creating new community:", newCommunity);

        // Save the community to the database
        const community = new Group(newCommunity);
        const savedCommunity = await community.save();

        console.log("Community created successfully:", savedCommunity);

        res.status(201).send({
            message: "Community created successfully",
            payload: savedCommunity
        });
    } catch (error) {
        console.error("Error creating community:", error);
        res.status(500).send({
            message: "Error creating community",
            error: error.message
        });
    }
}));

// Get all communities
communityApp.get("/all", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (_, res) => {
    const communities = await Group.find();
    res.status(200).send({
        message: "All communities retrieved",
        payload: communities
    });
}));

// Get a specific community by ID
communityApp.get("/:communityId", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const community = await Group.findOne({ group_id: communityId });

    if (!community) {
        res.status(404).send({ message: "Community not found" });
        return;
    }

    res.status(200).send({
        message: "Community retrieved",
        payload: community
    });
}));

// Join a community
communityApp.post("/join/:communityId", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const { userName, userId } = req.body;

    // Find the community
    const community = await Group.findOne({ group_id: communityId });

    if (!community) {
        res.status(404).send({ message: "Community not found" });
        return;
    }

    // Check if user is already a member
    const isMember = community.members.some(member => member.member_id === userId);

    if (isMember) {
        res.status(400).send({ message: "User is already a member of this community" });
        return;
    }

    // Add user to community members
    const newMember = {
        memberName: userName,
        member_id: userId,
        isAdmin: "no"
    };

    community.members.push(newMember);
    await community.save();

    res.status(200).send({
        message: "Successfully joined the community",
        payload: community
    });
}));

// Leave a community
communityApp.post("/leave/:communityId", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const { userId } = req.body;

    // Find the community
    const community = await Group.findOne({ group_id: communityId });

    if (!community) {
        res.status(404).send({ message: "Community not found" });
        return;
    }

    // Check if user is a member
    const memberIndex = community.members.findIndex(member => member.member_id === userId);

    if (memberIndex === -1) {
        res.status(400).send({ message: "User is not a member of this community" });
        return;
    }

    // Check if user is the creator (cannot leave if creator)
    if (community.creator_id === userId) {
        res.status(400).send({ message: "Creator cannot leave the community. Transfer ownership or delete the community instead." });
        return;
    }

    // Remove user from community members
    community.members.splice(memberIndex, 1);
    await community.save();

    res.status(200).send({
        message: "Successfully left the community",
        payload: community
    });
}));

// Get communities for a user
communityApp.get("/user/:userId", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Find communities where user is a member
    const communities = await Group.find({ "members.member_id": userId });

    res.status(200).send({
        message: "User communities retrieved",
        payload: communities
    });
}));

// Post a message to a community
communityApp.post("/message/:communityId", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const { communityId } = req.params;
    const messageData = req.body;

    // Find the community
    const community = await Group.findOne({ group_id: communityId });

    if (!community) {
        res.status(404).send({ message: "Community not found" });
        return;
    }

    // Check if the user is an admin of the community
    const isAdmin = community.members.some(member =>
        member.member_id === messageData.sender_id && member.isAdmin === "yes"
    );

    if (!isAdmin) {
        res.status(403).send({ message: "Only admins can post messages in this community" });
        return;
    }

    // Create a message ID
    const message_id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Create the message object
    const newMessage = {
        message_id,
        message: messageData.message,
        time: Date.now().toString(),
        sender: messageData.sender,
        sender_id: messageData.sender_id,
        status: "sent"
    };

    // Add message to community
    community.messages.push(newMessage);
    await community.save();

    res.status(201).send({
        message: "Message posted successfully",
        payload: newMessage
    });
}));

// Search communities by name
communityApp.get("/search/:query", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const { query } = req.params;

    // Search for communities with names containing the query
    const communities = await Group.find({
        groupName: { $regex: query, $options: 'i' }
    });

    res.status(200).send({
        message: "Search results",
        payload: communities
    });
}));

module.exports = communityApp;
