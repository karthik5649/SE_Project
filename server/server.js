const exp = require('express')
const app = exp()
const cors = require('cors')
const { createServer } = require('node:http');
const server = createServer(app);
const { Server } = require("socket.io");
const { join } = require('node:path')
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    }
});
const mongoose = require('mongoose');
require('dotenv').config()
const port = process.env.PORT
app.use(cors());
const userApp = require('./APIs/User')
const chatApp = require('./APIs/Chat');
const todoApp = require('./APIs/TodoList');
const communityApp = require('./APIs/Community');

mongoose.connect(process.env.DB_URL)
    .then(() => {
        server.listen(port, () => {
            console.log(`server is running on port ${port}`)
        })
        console.log("Db is connected")
    }).catch(() => {
        console.log("Error in connection with db")
    })

app.use(exp.json())
app.use('/userApp', userApp)
app.use('/chatApp', chatApp)
app.use('/todoApp', todoApp)
app.use('/communityApp', communityApp)

app.use((err, req, res, next) => {
    console.log("Error object in express async handler : ", err)
    res.send({ message: err })
})

// socket connection

io.on("connection", (socket) => {
    // Handle joining a room (for private chats or communities)
    socket.on("join_room", (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    // Handle private messages
    socket.on("send_message", (data) => {
        let room = data[1]
        let msg = data[0]
        io.to(room).emit("receive_message", [msg, room]);
    });

    // Handle community messages
    socket.on("join_community", (communityId) => {
        socket.join(`community_${communityId}`);
        console.log(`User ${socket.id} joined community ${communityId}`);
    });

    socket.on("leave_community", (communityId) => {
        socket.leave(`community_${communityId}`);
        console.log(`User ${socket.id} left community ${communityId}`);
    });

    socket.on("send_community_message", (data) => {
        const { communityId, message } = data;
        io.to(`community_${communityId}`).emit("receive_community_message", {
            communityId,
            message
        });
    });

    // Handle user online status
    socket.on("user_online", (userId) => {
        socket.userId = userId;
        io.emit("user_status", { userId, status: "online" });
    });

    socket.on("disconnect", () => {
        if (socket.userId) {
            io.emit("user_status", { userId: socket.userId, status: "offline" });
        }
    });
});
