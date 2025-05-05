import React from 'react'
import { createContext,useState } from 'react'
export const currentUserContextObj = createContext()

function CurrentUserContext({children}) {

  const [currentUser, setCurrentUser] = useState({
    userName:"",
    email:"",
    password:"",
    bio:"",
    profileImgUrl:"",
    phoneNumber:"",
    firstName:"",
    lastName:"",
    accountType:"",
    following:[],
    followers:[],
    chats : []
  });
  const [selectedUser,setSelectedUser] = useState({
    userName:"",
    email:"",
    password:"",
    bio:"",
    profileImgUrl:"",
    phoneNumber:"",
    firstName:"",
    lastName:"",
    accountType:"",
    following:[],
    followers:[],
    chats : []
  })
  const [loading,setLoading] = useState(true)

  return (
    <currentUserContextObj.Provider value={{currentUser,setCurrentUser,loading,setLoading,selectedUser,setSelectedUser}}>
      {children}
    </currentUserContextObj.Provider>
  )
}

export default CurrentUserContext
