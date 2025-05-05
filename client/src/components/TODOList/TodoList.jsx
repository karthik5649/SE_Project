import { useState, useEffect, useContext } from "react";
import AddTask from "./AddTask";
import TodoItem from "./ToDoItem";
import "./TodoList.css";
import { currentUserContextObj } from "../../context/currentUserContext";
import axios from "axios";
import { useAuth } from "@clerk/clerk-react";

const TodoList = () => {

  const { currentUser, setCurrentUser } = useContext(currentUserContextObj)
  const [tasks, setTasks] = useState([]);
  const [pendingTasks,setPendingTasks] = useState([])
  const [runningTasks,setRunningTasks] = useState([])
  const { getToken } = useAuth()

  // setting current user
  useEffect(() => {
    setCurrentUser({ ...JSON.parse(localStorage.getItem("currentuser")) })
    getTodoList();
  }, [])

  // notification
  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []); 

  useEffect(()=>{
    setPendingTasks([...tasks.filter(task => task.isPending === true)])
    setRunningTasks([...tasks.filter(task => task.isPending === false)])
  },[tasks])

  // getTodoListFromDatabase
  async function getTodoList() {
    let cuser = JSON.parse(localStorage.getItem("currentuser"))
    let token = await getToken()
    let res = await axios.get(`http://localhost:3000/todoApp/getTodoList/${cuser.userName}`, { headers: { Authorization: `Bearer ${token}` } });
    setTasks([...res.data.payload.todoList])
  }

  // addTask
  async function addTask(text, deadline) {
    let cuser = JSON.parse(localStorage.getItem("currentuser"))
    const newTask = {
      id: Date.now(),
      text: text,
      deadline: deadline,
      isPending: false
    };
    let token = await getToken()
    let res = await axios.put(`http://localhost:3000/todoApp/addTask/${cuser.userName}`, [newTask], { headers: { Authorization: `Bearer ${token}` } });
    // console.log(res.data.payload)
    setTasks([...res.data.payload.todoList].sort((a, b) => a.deadline - b.deadline));
  };

  // deleteTask
  async function deleteTask(taskId) {
    let cuser = JSON.parse(localStorage.getItem("currentuser"))
    let token = await getToken()
    let res = await axios.put(`http://localhost:3000/todoApp/deleteTask/${cuser.userName}`, [taskId], { headers: { Authorization: `Bearer ${token}` } });
    setTasks([...res.data.payload.todoList].sort((a, b) => a.deadline - b.deadline));
  };

  // markAsPending
  async function markTaskAsPending(taskId) {
    let token = await getToken()
    let cuser = JSON.parse(localStorage.getItem("currentuser"))
    let res = await axios.put(`http://localhost:3000/todoApp/markPending/${cuser.userName}`, [taskId], { headers: { Authorization: `Bearer ${token}` } });
    setTasks([...res.data.payload.todoList]);
  };

  return (
    <div>
      <div className="todo-container mt-5">
        <h1>To-Do List</h1>
        <AddTask onAdd={addTask} />
        <ul className="task-list">
          {pendingTasks.map((task) => (
            <TodoItem key={task.id} task={task} onDelete={deleteTask} onMarkPending={markTaskAsPending} onComplete={deleteTask} />
          ))}
          {runningTasks.map((task) => (
            <TodoItem key={task.id} task={task} onDelete={deleteTask} onMarkPending={markTaskAsPending} onComplete={deleteTask} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TodoList;
