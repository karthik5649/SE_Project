import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { currentUserContextObj } from '../context/currentUserContext';
import { useContext } from 'react';
import { Dropdown, ButtonGroup } from "react-bootstrap";
import { IoSearch } from "react-icons/io5";
import { IoIosNotifications } from "react-icons/io";
import Followers from './Followers';
import Followings from './Followings';


function Header() {

    const {isSignedIn,isLoaded,user} = useUser()
    const {signOut} = useClerk()
    const navigate = useNavigate()
    const {currentUser,setCurrentUser,loading,setLoading,selectedUser,setSelectedUser} = useContext(currentUserContextObj)

    // for loading
    useEffect(()=>{
        setTimeout(()=>setLoading(false),1000)
    },[])

    // to sign out
    async function handleSignout(){
        setCurrentUser({
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
            followers:[]
        })
        localStorage.setItem("currentuser",JSON.stringify({
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
            followers:[]
        }))
        setLoading(true)
        await signOut()
        navigate("/")
    }

    // to navigate to profile
    function toProfile(){
        localStorage.setItem("selecteduser",JSON.stringify({
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
            followers:[]
        }))
        setSelectedUser(JSON.parse(localStorage.getItem("selecteduser")))
        navigate(`../userprofile/${currentUser.userName}`)
    }

    // console.log("Current User : ",currentUser)

  return (
    <div className='shadow bg-dark'>
            <nav className='header d-flex justify-content-end pt-3 px-2'>
                {
                    isSignedIn ?
                    <>
                        <ul className='lead list-unstyled w-50 d-flex justify-content-around header-links align-items-center'>
                            <li>
                                <Link to='' className='text-white text-decoration-none'>Home</Link>
                            </li>
                            {
                                currentUser.userName.length == 0 ?
                                <button className="btn btn-outline-danger bg-white" onClick={handleSignout}>SignOut</button> :
                                <>
                                <div className='d-flex justify-content-around align-items-center' style={{width:"350px"}}>
                                    <li>
                                        <Link to="search_users_communities"><IoSearch className='text-light m-0 p-0 '/></Link>
                                    </li>
                                    <li>
                                        <Link to=""><IoIosNotifications className='text-light'/></Link>
                                    </li>
                                    <li>
                                        <Followers />
                                    </li>
                                    <li>
                                        <Followings />
                                    </li>
                                </div>
                                <Dropdown as={ButtonGroup}>
                                    <Dropdown.Toggle variant="outline-dark" className='bg-light'>
                                        <img src={currentUser.profileImgUrl} className='rounded-circle me-2' width={"30px"} alt="" />
                                    </Dropdown.Toggle>
                                    <Dropdown.Menu>
                                        <Dropdown.Item onClick={toProfile}>Your Profile</Dropdown.Item>
                                        <Dropdown.Item onClick={handleSignout} className='text-danger'>Sign Out</Dropdown.Item>
                                    </Dropdown.Menu>
                                </Dropdown>
                                </>
                            }
                        </ul>
                    </> :
                    <>
                        <ul className='lead list-unstyled w-50 d-flex justify-content-around header-links'>
                            <li>
                                <Link to='' className='text-white text-decoration-none'>Home</Link>
                            </li>
                            <li>
                                <Link to='signin' className='text-white text-decoration-none'>SignIn</Link>
                            </li>
                            <li>
                                <Link to='signup' className='text-white text-decoration-none'>SignUp</Link>
                            </li>
                        </ul>
                    </>
                }
            </nav>
    </div>
  )
}

export default Header
