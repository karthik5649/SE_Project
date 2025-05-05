import React, { useContext, useEffect, useRef, useState } from 'react'
import { currentUserContextObj } from '../context/currentUserContext'
import { useNavigate, Link } from 'react-router-dom'
import { FaArrowLeft } from "react-icons/fa";
import { IoSearch } from 'react-icons/io5';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { IoSend } from "react-icons/io5";
import { Spinner } from "react-bootstrap";
import io from 'socket.io-client';
import { IoMdArrowDropdown } from "react-icons/io";

function Messages() {

  const socket = io('http://localhost:3000');

  const { currentUser, setCurrentUser } = useContext(currentUserContextObj)
  const navigate = useNavigate()
  // Form1
  const {
    register: registerForm1,
    handleSubmit: handleSubmitForm1,
    reset: resetForm1,
  } = useForm();
  // Form 2
  const {
    register: registerForm2,
    handleSubmit: handleSubmitForm2,
    reset: resetForm2,
  } = useForm();
  const [chats, setChats] = useState([])
  const [selectedUser, setSelectedUser] = useState({
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
  })
  const [searchedUser, setSearchedUser] = useState({
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
  })
  const { getToken } = useAuth()
  const [chatError, setChatError] = useState("")
  const [loading, setLoading] = useState(true)
  const [flag, setFlag] = useState(0)
  const [chat, setChat] = useState({
    chatId: '',
    messages: [],
    time: '',
    isOnline: ''
  })
  const [msgs, setMsgs] = useState([])
  const messagesEndRef = useRef(null);
  const [show, setShow] = useState(false)

  // scroll function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // scroll 
  useEffect(() => {
    scrollToBottom();
  }, [msgs]); // when messages change

  useEffect(() => {
    scrollToBottom();
  });

  // socket joins room
  useEffect(() => {
    let cuser = JSON.parse(localStorage.getItem("currentuser"))
    socket.emit('join_room', cuser.userName)
  });

  // receives msg
  useEffect(() => {
    const handleMessage = (data) => {
      let suser = JSON.parse(localStorage.getItem("selecteduser"))
      console.log(data[0].senderUserName)
      console.log(suser.userName)
      if (data[0].senderUserName === suser.userName) {
        setMsgs((prevChat) => [...prevChat, data[0]]);
      }
    };

    socket.on("receive_message", handleMessage);

    // ✅ Clean up listener to prevent duplication
    return () => {
      socket.off("receive_message");
    };

  }, [])

  // declare variables
  useEffect(() => {
    // window.location.reload();
    setTimeout(() => { setLoading(false) }, 1000)
    setSelectedUser({ ...JSON.parse(localStorage.getItem("selecteduser")) })
    setChatError(localStorage.getItem("chaterror"))
    getCurrentUser()
    getChat()
  }, [])

  // gets current user
  useEffect(() => {
    getCurrentUser()
  }, [flag])

  // function to get current user
  async function getCurrentUser() {
    let cuser = JSON.parse(localStorage.getItem("currentuser"))
    let token = await getToken()
    let res = await axios.get(`http://localhost:3000/userApp/user/${cuser.email}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.status === 200) {
      let user = res.data.payload[0]
      setCurrentUser({ ...user })
      localStorage.setItem("currentuser", JSON.stringify(user))
      if (user.chats.length != 0) {
        setChats([...cuser.chats])
      }
    }
  }

  // function to handle message and emits msg to server
  async function handleMessage(obj) {
    let message = {
      messageId: chat.chatId + Date.now(),
      senderUserName: currentUser.userName,
      message: obj.msg,
      day: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      time: new Date().toLocaleString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      status: "sent"
    }
    setMsgs((prevChat) => [...prevChat, message]);
    socket.emit("send_message", ([message, selectedUser.userName]));
    addMessageIntoDatabase(message)
    resetForm2()
  }

  // adds msg to chat i.e. backend
  async function addMessageIntoDatabase(message) {
    try {
      let token = await getToken()
      let res = await axios.post(`http://localhost:3000/chatApp/message/${chat.chatId}`, [message], {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (res.data.message === true) {
        console.log("chat : ", res.data.payload)
        localStorage.setItem("chat", JSON.stringify({ ...res.data.payload }))
        setChat({ ...res.data.payload })
      }
    } catch (err) {
      console.log(err)
    }
  }

  // function to navigate
  function goToHomePage() {
    navigate('/')
  }

  // function to handle search
  async function handleSubmitSearch(obj) {
    // console.log(obj)
    let token = await getToken()
    let res = await axios.get(`http://localhost:3000/userApp/userName/${obj.userName}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.data.payload.length != 0) {
      setSearchedUser(...res.data.payload)
      localStorage.setItem("searcheduser", JSON.stringify({ ...res.data.payload }))
    }
    resetForm1()
  }

  // function to add to selected user
  function addUserToSelectedUser(userObj) {
    localStorage.setItem("chaterror", (""))
    setChatError("")
    localStorage.setItem("selecteduser", JSON.stringify({ ...userObj }))
    setSelectedUser({ ...userObj })
    getChat()
  }

  // checks searched user is in chats or not
  async function checkIfUserIsInChats() {
    localStorage.setItem("chaterror", (""))
    setChatError("")
    let token = await getToken()
    let res = await axios.put(`http://localhost:3000/chatApp/checkChat`, [currentUser, searchedUser], {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    if (res.data.indication == true) {
      if (res.data.message == "chat already exists") {
        localStorage.setItem("currentuser", JSON.stringify({ ...res.data.payload[0] }))
        setCurrentUser({ ...res.data.payload[0] })
        localStorage.setItem("selecteduser", JSON.stringify({ ...res.data.chat }))
        setSelectedUser({ ...res.data.chat })
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
        setSearchedUser({
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
        })
        getChat()
      } else if (res.data.message == "account is public type" || res.data.message == "The user if following currentUser") {
        localStorage.setItem("currentuser", JSON.stringify({ ...res.data.payload[0] }))
        setCurrentUser({ ...res.data.payload[0] })
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
        setSearchedUser({
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
        })
        localStorage.setItem("selecteduser", JSON.stringify({ ...res.data.chat }))
        setSelectedUser({ ...res.data.chat })
        setFlag(flag + 1)
        getChat()
      } else if (res.data.message == "you can chat with your self") {
        localStorage.setItem("currentuser", JSON.stringify({ ...res.data.payload[0] }))
        setCurrentUser({ ...res.data.payload[0] })
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
        setSearchedUser({
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
        })
        localStorage.setItem("selecteduser", JSON.stringify({ ...res.data.chat }))
        setSelectedUser({ ...res.data.chat })
        // setChats([...JSON.parse("currentuser").chats])
        setFlag(flag + 1)
        getChat()
      }
    } else {
      localStorage.setItem("chaterror", (res.data.message))
      setChatError(res.data.message)
      localStorage.setItem("selecteduser", JSON.stringify({ ...searchedUser }))
      setSelectedUser({ ...searchedUser })
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
      setSearchedUser({
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
      })
    }
  }

  // getting chat with userName
  async function getChat() {
    let suser = JSON.parse(localStorage.getItem("selecteduser"))
    if (suser.userName.length > 0) {
      let token = await getToken()
      let res = await axios.get(`http://localhost:3000/chatApp/getChat/${suser.chatId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setChat({ ...res.data.payload })
      setMsgs([...res.data.payload.messages])
    }
  }

  // function to delete msg
  async function deleteMessage(messageId) {
    let token = await getToken()
    let res = await axios.put(`http://localhost:3000/chatApp/delete`, [chat.chatId, messageId], {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    })
    if (res.data.message) {
      setChat({ ...res.data.payload })
      setMsgs([...res.data.payload.messages])
    }
  }

  return (
    <div className=''>

      {
        loading === true ?
          <>
            <div className='d-flex justify-content-center align-items-center pt-5 mt-5'>
              <Spinner animation="border" variant="secondary" />
            </div>
          </> :
          <>
            <div className='d-flex'>

              <div className='border-start border-end vh-100' style={{ width: "30%" }}>
                <div className='mb-3'>
                  {/* button to goto home */}
                  <button className="btn" onClick={goToHomePage}>
                    <FaArrowLeft style={{ width: "25px", height: "25px" }} />
                  </button>
                  {/* search bar */}
                  <form onSubmit={handleSubmitForm1(handleSubmitSearch)} className='d-flex border rounded-pill border-2 px-3' style={{ width: "100%" }}>
                    <input type="text" className='form-control border border-0' {...registerForm1("userName")} placeholder="Search users..." />
                    <button className="btn btn-outline-light" type="submit"><IoSearch className='text-dark m-0 p-0 ' /></button>
                  </form>
                </div>

                {
                  searchedUser.userName.length != 0 ?
                    <>
                      {/* searched user chat */}
                      <Link onClick={checkIfUserIsInChats} className='text-decoration-none w-100 hovering-chats'>
                        <div key={searchedUser.userName} className='text-dark d-flex justify-content-evenly align-items-center py-3'>
                          <img src={searchedUser.profileImgUrl} className='rounded-circle' width="35px" height="35px" alt="" />
                          <div className=''>
                            <h5 className='text-start pb-1 m-0'>{searchedUser.userName}</h5>
                            <p className='p-0 m-0 text-secondary text-start'>{searchedUser.firstName + " " + searchedUser.lastName}</p>
                          </div>
                        </div>
                      </Link>
                    </> :
                    <>
                      {
                        (chats.length === 0 && searchedUser.userName.length === 0) ?
                          // user chats 
                          <div className='d-flex justify-content-center align-items-center'>
                            <p className='text-secondary text-center p-3'>--Search your followers--</p>
                          </div> :
                          <>
                            <div className='overflow-auto' style={{ height: "88vh" }}>
                              {
                                chats.map((userObj) =>
                                  <Link onClick={() => addUserToSelectedUser(userObj)} className='text-decoration-none w-100 hovering-chats' key={userObj.userName}>
                                    <div key={userObj.userName} className='text-dark d-flex justify-content-evenly align-items-center py-3'>
                                      <img src={userObj.profileImgUrl} className='rounded-circle' width="35px" height="35px" alt="" />
                                      <div className=''>
                                        <h5 className='text-start pb-1 m-0'>{userObj.userName}</h5>
                                        <p className='p-0 m-0 text-secondary text-start'>{userObj.firstName + " " + userObj.lastName}</p>
                                      </div>
                                    </div>
                                  </Link>
                                )
                              }
                            </div>
                          </>
                      }
                    </>
                }

              </div>

              <div class="container vh-100 d-flex flex-column">
                {
                  selectedUser.userName.length === 0 ?
                    <div className='vh-100 d-flex align-items-center justify-content-center'>
                      <p className='text-secondary'>--Select a chat and text them here--</p>
                    </div> :
                    <>
                      {/* selected chat header */}
                      <div className='d-flex p-3 align-items-center border-bottom'>
                        <img src={selectedUser.profileImgUrl} className='rounded-circle me-3' width="40px" height="40px" alt="" />
                        <h5 className='text-start pb-1 m-0'>{selectedUser.userName}</h5>
                      </div>
                      {
                        chatError.length != 0 ?
                          <div className='d-flex justify-content-center align-items-center vh-100'>
                            <p className='text-danger'>--You cannot message them untill they follow you--</p>
                          </div> :
                          <>
                            {/* selected chat messages */}
                            <div class="flex-grow-1 overflow-auto p-3 msg-display" id="chat-messages">
                              {
                                msgs.map((msg) =>
                                  <div className='w-100' key={msg.messageId}>
                                    {
                                      msg.senderUserName === currentUser.userName
                                        ?
                                        <div className='d-flex justify-content-end my-3' >
                                          <div
                                            onMouseEnter={() => setShow(true)}
                                            onMouseLeave={() => setShow(false)}
                                            className='bg-white px-4 py-2 rounded-3'
                                          >
                                            <div className="d-flex justify-content-between">
                                              <p className='p-0 m-0 me-3'>{msg.message}</p>
                                              <div className="dropdown d-flex justify-content-end">
                                                <button className="border-0 bg-white m-0 p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                  <IoMdArrowDropdown className='m-0 p-0' />
                                                </button>
                                                <ul className="dropdown-menu">
                                                  <li><a onClick={() => deleteMessage(msg.messageId)} className="dropdown-item text-danger">Delete</a></li>
                                                </ul>
                                              </div>
                                            </div>
                                            <p className='text-secondary text-end p-0 m-0' style={{ "fontSize": "12px" }}>{msg.time}</p>
                                          </div>
                                        </div>
                                        :
                                        <div className='d-flex justify-content-start my-3' >
                                          <div
                                            onMouseEnter={() => setShow(true)}
                                            onMouseLeave={() => setShow(false)}
                                            className='bg-white px-4 py-2 rounded-3'
                                          >
                                            <div className="d-flex justify-content-between">
                                              <p className='p-0 m-0 me-3'>{msg.message}</p>
                                              <div className="dropdown d-flex justify-content-end">
                                                <button className="border-0 bg-white m-0 p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                  <IoMdArrowDropdown className='m-0 p-0' />
                                                </button>
                                                <ul className="dropdown-menu">
                                                  <li><a onClick={() => deleteMessage(msg.messageId)} className="dropdown-item text-danger">Delete</a></li>
                                                </ul>
                                              </div>
                                            </div>
                                            <p className='text-secondary text-end p-0 m-0' style={{ "fontSize": "12px" }}>{msg.time}</p>
                                          </div>
                                        </div>
                                    }
                                  </div>
                                )
                              }
                              <div ref={messagesEndRef} />
                            </div>
                            {/* selected chat send bar */}
                            <div class="border-top p-3 bg-white">
                              <form onSubmit={handleSubmitForm2(handleMessage)} className='d-flex border rounded-pill border-2 px-3' style={{ width: "100%" }}>
                                <input type="text" className='form-control border border-0' {...registerForm2("msg")} placeholder="Type message here ..." />
                                <button className="btn" type="submit"><IoSend /></button>
                              </form>
                            </div>
                          </>
                      }
                    </>
                }
              </div>

            </div>
          </>
      }

    </div>
  )
}

export default Messages
