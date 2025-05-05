const exp = require('express')
const todoApp = exp();
const expressAsyncHandler = require("express-async-handler")
const { requireAuth } = require('@clerk/express')
require('dotenv').config()
const TodoList = require('../Modals/TodoList');


todoApp.get("/unauthorised", expressAsyncHandler(async (req, res) => {
    res.send({ message: "Unauthorised access . please signin to access" })
}))

todoApp.post("/createTodo", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    username = req.body[0]
    let todo = {
        userName: username,
        todoList: []
    }
    let newTodoObj = new TodoList(todo)
    let newTodo = await newTodoObj.save()
    res.status(201).send({ message: 'successfully created', payload: newTodo })
}))

todoApp.get("/getTodoList/:userName", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    userName = req.params.userName
    const todoList = await TodoList.findOne({ userName: userName });
    res.send({ payload: todoList })
}))

todoApp.put("/addTask/:userName", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const [newTask] = req.body;
    const userName = req.params.userName
    let todoList = await TodoList.findOneAndUpdate(
        { userName: userName },
        { $push: { todoList: newTask } },
        { returnOriginal: false }
    )
    res.send({ message: "The msg is sent", payload: todoList })
}))

todoApp.put("/deleteTask/:userName", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const taskId = req.body[0];
    const userName = req.params.userName
    let todoList = await TodoList.findOneAndUpdate(
        { userName: userName },
        { $pull: { todoList: { id: taskId } } },
        { returnOriginal: false }
    )
    res.send({ message: "The task deleted", payload: todoList })
}))

todoApp.put("/markPending/:userName", requireAuth({ signInUrl: "unauthorize" }), expressAsyncHandler(async (req, res) => {
    const taskId = req.body[0];
    const userName = req.params.userName
    // console.log(taskId,userName)
    let todoList = await TodoList.findOneAndUpdate(
        {
            userName: userName,         // the user the todo belongs to
            'todoList.id': taskId          // the specific todo's id
        },
        {
            $set: {
                'todoList.$.isPending': true   // update the matched array element
            }
        },
        { returnOriginal: false }
    )
    res.send({ message: "The task deleted", payload: todoList })
}))

module.exports = todoApp
