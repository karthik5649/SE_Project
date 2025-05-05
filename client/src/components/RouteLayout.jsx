import React, { useContext, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useUser } from '@clerk/clerk-react'
import { currentUserContextObj } from '../context/currentUserContext'
import { Spinner } from "react-bootstrap";

function RouteLayout() {

  const {isLoaded,isSignedIn,user} = useUser()
  const {currentUser,setCurrentUser,loading,setLoading} = useContext(currentUserContextObj)

  // for loading
  useEffect(()=>{
    setTimeout(()=>setLoading(false),1000)
  },[])

  return (
    <div className='d-flex'>
        {
          loading ?
          <div className='d-flex justify-content-center align-items-center w-100 vh-100'>
              <Spinner animation="border" variant="secondary" />
          </div> :
          <>
            {
              (isSignedIn && currentUser.userName.length != 0 ) && <Sidebar/>
            }
            <div className='w-100'>
              <Header/>
              <div className=''>
                <Outlet />
              </div>
            </div>
          </>
        }
    </div>
  )
}

export default RouteLayout
