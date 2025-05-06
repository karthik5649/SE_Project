import React, { useContext, useEffect, useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { currentUserContextObj } from '../context/currentUserContext'
import { useForm } from 'react-hook-form'
import { useAuth } from '@clerk/clerk-react'
import { Spinner } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios"

function Home() {

  const { isSignedIn, user, isLoaded } = useUser()
  const { currentUser, setCurrentUser, loading, setLoading } = useContext(currentUserContextObj)
  const { register, handleSubmit, formState: { errors }, reset } = useForm()
  const [error, setError] = useState("")
  const [flag, setFlag] = useState(0)
  const [userSetFlag, setUserSetFlag] = useState(0)
  const { getToken } = useAuth()
  const [load, setLoad] = useState(true)
  const [chat, setChat] = useState([])
  const [upcomingTodos, setUpcomingTodos] = useState([])

  // useeffect for loading
  useEffect(() => {
    setTimeout(() => setLoading(false), 1000)
    setTimeout(() => setLoad(false), 1000)
  }, [])

  // Fetch user's todo list when logged in
  useEffect(() => {
    if (isSignedIn && currentUser.userName && currentUser.userName.length > 0) {
      fetchUserTodos();
    }
  }, [isSignedIn, currentUser.userName])

  // copies user data into current user data when loaded
  useEffect(() => {
    if (isSignedIn) {
      setCurrentUser({
        ...currentUser,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.emailAddresses[0].emailAddress,
        profileImgUrl: user?.imageUrl
      })
      setFlag(1)
    }
  }, [isLoaded])

  // verify whether user present or not
  useEffect(() => {
    if (currentUser.email.length != 0 && isSignedIn === true) {
      localStorage.setItem("currentuser", JSON.stringify({
        userName: "",
        email: "",
        password: "",
        bio: "",
        profileImgUrl: "",
        phoneNumber: "",
        firstName: "",
        lastName: "",
        accountType: "",
        following: [],
        followers: [],
        chats: []
      }))
      localStorage.setItem("selecteduser", JSON.stringify({
        userName: "",
        email: "",
        password: "",
        bio: "",
        profileImgUrl: "",
        phoneNumber: "",
        firstName: "",
        lastName: "",
        accountType: "",
        following: [],
        followers: [],
        chats: []
      }))
      localStorage.setItem("searcheduser", JSON.stringify({
        userName: "",
        email: "",
        password: "",
        bio: "",
        profileImgUrl: "",
        phoneNumber: "",
        firstName: "",
        lastName: "",
        accountType: "",
        following: [],
        followers: [],
        chats: []
      }))
      localStorage.setItem("chaterror", (""))
      localStorage.setItem("chat", JSON.stringify({
        chatId: '',
        messages: [],
        time: '',
        isOnline: ''
      }))
      localStorage.setItem("tasks",JSON.stringify([]))
      getUser()
    }
  }, [flag])

  // request to get user
  async function getUser() {
    let token = await getToken()
    let res = await axios.get(`http://localhost:3000/userApp/user/${currentUser.email}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.status === 200) {
      let user = res.data.payload[0]
      setCurrentUser({ ...user })
      localStorage.setItem("currentuser", JSON.stringify({ ...user }))
    }
  }

  // gets details from form
  function getDetails(obj) {
    localStorage.setItem("currentuser", JSON.stringify({
      userName: "",
      email: "",
      password: "",
      bio: "",
      profileImgUrl: "",
      phoneNumber: "",
      firstName: "",
      lastName: "",
      accountType: "",
      following: [],
      followers: [],
      chats: []
    }))
    localStorage.setItem("selecteduser", JSON.stringify({
      userName: "",
      email: "",
      password: "",
      bio: "",
      profileImgUrl: "",
      phoneNumber: "",
      firstName: "",
      lastName: "",
      accountType: "",
      following: [],
      followers: [],
      chats: []
    }))
    localStorage.setItem("searcheduser", JSON.stringify({
      userName: "",
      email: "",
      password: "",
      bio: "",
      profileImgUrl: "",
      phoneNumber: "",
      firstName: "",
      lastName: "",
      accountType: "",
      following: [],
      followers: [],
      chats: []
    }))
    localStorage.setItem("chat", JSON.stringify({
      chatId: '',
      messages: [],
      time: '',
      isOnline: '',
    }))
    localStorage.setItem("chaterror", (""))
    let newUser = {
      ...obj,
      profileImgUrl: user?.imageUrl,
      password: "",
      followers: [],
      following: [],
      chats: []
    }
    reset()
    checkUsername(newUser)
  }

  // checks whether username is unique or not
  async function checkUsername(newUser) {
    let token = await getToken()
    let res = await axios.get(`http://localhost:3000/userApp/userName/${newUser.userName}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.data.message) {
      setLoading(true)
      setTimeout(() => setLoading(false), 1000)
      setUser(newUser)
    } else {
      setError("Username already exists")
    }
  }

  // sets user
  async function setUser(newUser) {
    let token = await getToken()
    let res = await axios.post(`http://localhost:3000/userApp/user`, newUser, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.data.payload.length != 0) {
      createTodoList(newUser.userName)
      setCurrentUser({
        ...res.data.payload
      })
      localStorage.setItem("currentuser", JSON.stringify({ ...res.data.payload[0] }))
    } else {
      setError("Failed to create user")
    }
  }

  // create todo list
  async function createTodoList(user){
    let token = await getToken()
    let res = await axios.post(`http://localhost:3000/todoApp/createTodo`,[user],{
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    // console.log(res.data)
  }

  // Fetch user's todo list
  async function fetchUserTodos() {
    try {
      const token = await getToken();
      const response = await axios.get(`http://localhost:3000/todoApp/getTodoList/${currentUser.userName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data && response.data.payload && response.data.payload.todoList) {
        // Sort tasks by pending status and deadline
        const sortedTasks = [...response.data.payload.todoList].sort((a, b) => {
          // First sort by pending status
          if (a.isPending !== b.isPending) {
            return a.isPending ? 1 : -1;
          }

          // Then sort by deadline if available
          if (a.deadline && b.deadline) {
            return new Date(a.deadline) - new Date(b.deadline);
          }

          return 0;
        });

        // Take only the first 3 non-pending tasks
        const upcomingTasks = sortedTasks
          .filter(task => !task.isPending)
          .slice(0, 3);

        setUpcomingTodos(upcomingTasks);

        // Show notification only if we have tasks
        if (upcomingTasks.length > 0) {
          showNotification();
        }
      }
    } catch (error) {
      console.error("Error fetching todo list:", error);
    }
  }

  // Show notification
  const showNotification = () => {
    toast.info("📋 You have upcoming tasks to complete!", {
      position: "top-right",
      autoClose: 3000, // Auto-dismiss in 3 seconds
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    })
  }

  // console.log(chat)

  return (
    <div>
      {
        load ?
          <div className='d-flex justify-content-center align-items-center pt-5 mt-5'>
            <Spinner animation="border" variant="secondary" />
          </div> :
          <>
            {
              isSignedIn == false &&
              <>
                <section className="d-flex justify-content-center align-items-center h-100 mt-5">
                  <div className="hero-content vh-100 text-center">
                    <h1 className='text-center m-5'>StudySync</h1>
                    <h6 className='text-center'>"Empower Your Learning Journey"</h6>
                    <p>""Unlock a world of academic resources, collaboration, and success.""</p>
                    {/* <div className="cta-btn">Join Community</div> */}
                  </div>
                </section>

                <footer>
                  <p>&copy; 2025 STUDYSYNC WELCOME.</p>
                </footer>
              </>
            }
            {
              (isSignedIn == true && currentUser.userName.length == 0) &&
              <div className='d-flex justify-content-center align-items-center'>
                <form className='w-50 border rounded-4 p-4 shadow-lg' onSubmit={handleSubmit(getDetails)}>
                  <h1 className='text-center'>User Details</h1>

                  {/* userName */}
                  <div className='mt-5'>
                    <label htmlFor="userName" className='form-label h6 fw-bold'>User Name : </label>
                    <input type="text" placeholder='Enter userName' id='userName' {...register("userName", { required: true })} className='form-control' />
                    <p className='text-danger pt-2 mb-0 text-center'>*user name must be unique*</p>
                    {errors.userName && <p className='text-danger text-center m-2'>*username is required*</p>}
                  </div>

                  {/* email */}
                  <div className='mt-5'>
                    <label htmlFor="email" className='form-label h6 fw-bold'>Email : </label>
                    <input type="text" placeholder='Enter email' value={currentUser.email} id='email' {...register("email", { required: true })} className='form-control' />
                    {errors.email && <p className='text-danger text-center m-2'>*email is required*</p>}
                  </div>

                  {/* firstName */}
                  <div className='mt-5'>
                    <label htmlFor="firstName" className='form-label h6 fw-bold'>First Name : </label>
                    <input type="text" placeholder='Enter first name' id='firstName' {...register("firstName", { required: true })} className='form-control' />
                    {errors.firstName && <p className='text-danger text-center m-2'>*first name is required*</p>}
                  </div>

                  {/* lastName */}
                  <div className='mt-5'>
                    <label htmlFor="lastName" className='form-label h6 fw-bold'>Last Name : </label>
                    <input type="text" placeholder='Enter last name' id='lastName' {...register("lastName", { required: true })} className='form-control' />
                    {errors.lastName && <p className='text-danger text-center m-2'>*last name is required*</p>}
                  </div>

                  {/* PhoneNumber */}
                  <div className='mt-5'>
                    <label htmlFor="phoneNumber" className='form-label h6 fw-bold'>Phone Number : </label>
                    <input type="text" placeholder='Enter phone number' id='phoneNumber' {...register("phoneNumber", { required: true })} className='form-control' />
                    {errors.phoneNumber && <p className='text-danger text-center m-2'>*phone number is required*</p>}
                  </div>

                  {/* account type */}
                  <div className='mt-5'>
                    <label htmlFor="" className=' fw-bold'>Account Type : </label>
                    <div className="row py-3 px-4">
                      <div className=''>
                        <label className="items-center ">
                          <input
                            type="radio"
                            value="public"
                            {...register("accountType", { required: true })}
                            className='me-3'
                          />
                          <span>Public</span>
                        </label>
                      </div>
                      <div className=''>
                        <label className="items-center">
                          <input
                            type="radio"
                            value="private"
                            {...register("accountType", { required: true })}
                            className='me-3'
                          />
                          <span>Private</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* bio */}
                  <div className='mt-5'>
                    <label htmlFor="bio" className='form-label h6 fw-bold'>Bio : </label>
                    <input type="text" placeholder='Enter bio' id='bio'  {...register("bio")} className='form-control' />
                  </div>

                  <p className='mt-4 text-secondary text-center'>*Verify your details and submit*</p>

                  <button className='btn btn-primary mt-3' type="submit">Submit</button>
                  {
                    error.length != 0 && <p className='text-danger text-center mt-3'>*{error}*</p>
                  }
                </form>
              </div>
            }
            {
              (isSignedIn == true && currentUser.userName.length != 0) &&
              <div className="container py-5">
                {/* Welcome Banner */}
                <div className="row mb-5">
                  <div className="col-12">
                    <div className="card bg-primary text-white shadow-lg rounded-4">
                      <div className="card-body p-5">
                        <div className="row align-items-center">
                          <div className="col-md-8">
                            <h1 className="display-4 fw-bold">Welcome back, {currentUser.firstName}!</h1>
                            <p className="lead mb-4">Ready to connect, learn, and grow with your community today?</p>
                            <a href="/communities" className="btn btn-light btn-lg me-3">Explore Communities</a>
                            <a href="/messages" className="btn btn-outline-light btn-lg">View Messages</a>
                          </div>
                          <div className="col-md-4 text-center d-none d-md-block">
                            <img
                              src={currentUser.profileImgUrl || "https://via.placeholder.com/150"}
                              alt="Profile"
                              className="rounded-circle img-fluid border border-5 border-white shadow"
                              style={{maxWidth: "150px"}}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="row mb-5">
                  <div className="col-12">
                    <h2 className="mb-4 fw-bold">Quick Actions</h2>
                    <div className="row g-4">
                      <div className="col-md-3 col-sm-6">
                        <div className="card h-100 shadow-sm hover-shadow border-0 rounded-4">
                          <div className="card-body text-center p-4">
                            <div className="bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: "80px", height: "80px"}}>
                              <i className="bi bi-chat-dots fs-1 text-primary"></i>
                            </div>
                            <h5 className="card-title">Messages</h5>
                            <p className="card-text text-muted">Connect with friends and colleagues</p>
                            <a href="/messages" className="stretched-link"></a>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 col-sm-6">
                        <div className="card h-100 shadow-sm hover-shadow border-0 rounded-4">
                          <div className="card-body text-center p-4">
                            <div className="bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: "80px", height: "80px"}}>
                              <i className="bi bi-people fs-1 text-primary"></i>
                            </div>
                            <h5 className="card-title">Communities</h5>
                            <p className="card-text text-muted">Join discussions and share ideas</p>
                            <a href="/communities" className="stretched-link"></a>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 col-sm-6">
                        <div className="card h-100 shadow-sm hover-shadow border-0 rounded-4">
                          <div className="card-body text-center p-4">
                            <div className="bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: "80px", height: "80px"}}>
                              <i className="bi bi-check2-square fs-1 text-primary"></i>
                            </div>
                            <h5 className="card-title">Todo List</h5>
                            <p className="card-text text-muted">Manage your tasks and stay organized</p>
                            <a href="/todolist" className="stretched-link"></a>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3 col-sm-6">
                        <div className="card h-100 shadow-sm hover-shadow border-0 rounded-4">
                          <div className="card-body text-center p-4">
                            <div className="bg-light rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center" style={{width: "80px", height: "80px"}}>
                              <i className="bi bi-person-circle fs-1 text-primary"></i>
                            </div>
                            <h5 className="card-title">Profile</h5>
                            <p className="card-text text-muted">Update your information and settings</p>
                            <a href={`/userprofile/${currentUser.userName}`} className="stretched-link"></a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Tasks */}
                <div className="row mb-5">
                  <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h2 className="fw-bold mb-0">Upcoming Tasks</h2>
                      <a href="/todolist" className="text-decoration-none">View All</a>
                    </div>
                    <div className="card border-0 shadow-sm rounded-4">
                      <div className="card-body p-4">
                        {upcomingTodos.length > 0 ? (
                          upcomingTodos.map((todo, index) => (
                            <div key={todo.id || index} className={`d-flex justify-content-between align-items-center ${index < upcomingTodos.length - 1 ? 'mb-4' : ''}`}>
                              <div>
                                <h6 className="mb-1">{todo.text}</h6>
                                <p className="text-muted mb-0">
                                  {todo.deadline
                                    ? `Due ${new Date(todo.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                                    : 'No deadline set'}
                                </p>
                              </div>
                              <span className="badge bg-primary">
                                Task
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <i className="bi bi-check2-all text-muted fs-1"></i>
                            <p className="mt-3 mb-0">No upcoming tasks</p>
                            <a href="/todolist" className="btn btn-sm btn-outline-primary mt-3">Add a task</a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hidden TodoList button for functionality preservation */}
                <div className="d-none">
                  <div className="btn btn-primary" onClick={createTodoList}>TodoList</div>
                </div>

                <ToastContainer />
              </div>
            }
          </>
      }
    </div>
  )
}

export default Home
