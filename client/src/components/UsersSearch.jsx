import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { IoSearch } from 'react-icons/io5'
import axios from "axios"
import { useAuth } from '@clerk/clerk-react'
import { Link, useNavigate } from 'react-router-dom'
import { Spinner } from 'react-bootstrap'
import { toast, ToastContainer } from 'react-toastify'

function UsersSearch() {

    const {register,handleSubmit,reset,formState: { errors }} = useForm()
    const {getToken} = useAuth()
    const [searchedUsers,setSearchedUsers] = useState([])
    const [loading,setLoading] = useState(0)
    const [flag,setFlag] = useState(0)
    const navigate = useNavigate()

    async function handleSubmitSearch(obj){
        setSearchedUsers([])
        setLoading(1)
        setFlag(1)
        let token = await getToken()
        let res = await axios.get(`http://localhost:3000/userApp/userName/${obj.userName}`,{
            headers:{
            'Authorization' : `Bearer ${token}`
            }
        })
        setTimeout(()=>{
            setLoading(0)
        },[1000])
        if(res.data.payload.length != 0){
            setSearchedUsers(res.data.payload)
        }
        reset()
    }

    useEffect(()=>{
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
    },[])

    function toUserProfile(searchedUserObj){
        // console.log(userObj)
        localStorage.setItem("selecteduser",JSON.stringify(searchedUserObj))
        navigate(`../userprofile/${searchedUserObj.userName}`,{state : searchedUserObj});
    }

    // console.log("User : ",JSON.parse(localStorage.getItem("selecteduser")))
    // console.log(searchedUsers[0])

  return (
    <div className='d-flex justify-content-center mt-5'>
        <div className='w-50'>
            <h1 className='mb-3 text-center'>search users here</h1>
            <form onSubmit={handleSubmit(handleSubmitSearch)} className='d-flex border rounded-pill border-2 px-3' style={{width:"100%"}}>
                <input type="text" className='form-control border border-0' {...register("userName",{required:true})} placeholder="Search users..." />
                <button className="btn btn-outline-light" type="submit"><IoSearch className='text-dark m-0 p-0 '/></button>
            </form>
            {errors.userName && <p className='text-secondary text-center mt-3'>*Enter the input field*</p>}
            {
                loading === 1 ?
                <div className='w-100 d-flex justify-content-center mt-5'>
                    <Spinner animation="border" variant="secondary" />
                </div> : 
                <>
                    {
                        (searchedUsers.length === 0) ?
                        <>
                            {
                                (flag === 1) && <p className='text-secondary text-center mt-5'>No user found</p>
                            }
                        </> :
                        <>
                            {
                                searchedUsers.map((userObj)=>
                                    <Link onClick={()=>toUserProfile(userObj)} key={userObj.userName} className='text-decoration-none p-5 w-100'>
                                        <div className='text-dark d-flex justify-content-evenly p-2 rounded-4 shadow'>
                                            <img src={userObj.profileImgUrl} className='rounded-circle' width="50px" height="50px" alt="" />
                                            <div className=''>
                                                <h5 className='text-start pb-1 m-0'>{userObj.userName}</h5>
                                                <p className='p-0 m-0 text-secondary text-start'>{userObj.firstName+" "+userObj.lastName}</p>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            }
                            {/* <p>Xyhucuwcbeifgeufue</p> */}
                        </>
                    }
                </>
            }
        </div>
    </div>
  )
}

export default UsersSearch
