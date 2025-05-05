import React, { useContext, useEffect, useState } from 'react'
import { currentUserContextObj } from '../../context/currentUserContext'
import { useUser } from '@clerk/clerk-react'
import '../SearchUsersCommunities/SearchUsersCommunities.css'
import UsersSearch from '../UsersSearch'
import CommunitiesSearch from '../CommunitiesSearch'

function SearchUsersCommunities() {

    const {currentUser,setCurrentUser} = useContext(currentUserContextObj)
    const {isSignedIn,user,isLoaded} = useUser()
    const [flag,setFlag] = useState(0)

    useEffect(()=>{
        setCurrentUser(JSON.parse(localStorage.getItem("currentuser")))
    },[])

  return (
    <div>
        <div className='d-flex justify-content-around mt-4 mb-4'>
            <div className="btn btn-outline-dark fs-5" onClick={()=>setFlag(0)}>User Profiles</div>
            <div className="btn btn-outline-dark fs-5" onClick={()=>setFlag(1)}>Communities</div>
        </div>
        {
            flag === 0 ?
            <>
                <UsersSearch/>
            </> :
            <>
                <CommunitiesSearch/>
            </>
        }
    </div>
  )
}

export default SearchUsersCommunities
