const mongoose = require('mongoose')

const todoSchema = new mongoose.Schema({
    deadline:{
        type : String,
        required : true
    },id:{
        type : String,
        required : true
    },isPending:{
        type : Boolean,
        default : false
    },text:{
        type : String,
        required : true
    }
},{"strict" : "throw"})

const todoListSchema = new mongoose.Schema({
    userName : {
        type : String,
        required : true,
        unique : true
    },
    todoList : [todoSchema]
},{"strict" : "throw"})

const TodoList = mongoose.model('todolist',todoListSchema)
module.exports = TodoList
