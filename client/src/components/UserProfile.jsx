import React, { useContext, useEffect, useState, useRef } from 'react'
import { currentUserContextObj } from '../context/currentUserContext'
import { useUser } from '@clerk/clerk-react'
import axios from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Spinner, Button, Form, Card, Row, Col, Modal, Badge, ListGroup, Tab, Nav, Alert } from 'react-bootstrap'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

function UserProfile() {

    const { currentUser, setCurrentUser, selectedUser, setSelectedUser } = useContext(currentUserContextObj)
    const { isSignedIn, user, isLoaded } = useUser()
    const { getToken } = useAuth()
    const [ans, setAns] = useState(false)
    const [loading, setLoading] = useState(1)
    const [screenLoading, setScreenLoading] = useState(1)
    const [error, setError] = useState("")
    const { userName } = useParams()
    const [msgButton, setMsgButton] = useState(false)

    // Profile editing states
    const [editMode, setEditMode] = useState({
        basic: false,
        education: false,
        experience: false,
        skills: false
    })
    const [showEducationModal, setShowEducationModal] = useState(false)
    const [showExperienceModal, setShowExperienceModal] = useState(false)
    const [showSkillModal, setShowSkillModal] = useState(false)
    const [currentEducation, setCurrentEducation] = useState(null)
    const [currentExperience, setCurrentExperience] = useState(null)
    const [currentSkill, setCurrentSkill] = useState(null)
    const [educationIndex, setEducationIndex] = useState(-1)
    const [experienceIndex, setExperienceIndex] = useState(-1)
    const [skillIndex, setSkillIndex] = useState(-1)
    const [profileData, setProfileData] = useState({
        firstName: '',
        lastName: '',
        headline: '',
        email: '',
        bio: '',
        location: '',
        website: '',
        education: [],
        experience: [],
        skills: []
    })
    const [saving, setSaving] = useState(false)
    const [uploadingResume, setUploadingResume] = useState(false)
    const resumeFileRef = useRef(null)

    useEffect(() => {
        setTimeout(() => setScreenLoading(0), 1000)
        setTimeout(() => setLoading(0), 1000)
        setCurrentUser(JSON.parse(localStorage.getItem("currentuser")))
        getCurrentUser()
        getSelectedUser()
    }, [])

    // Initialize profile data when currentUser changes
    useEffect(() => {
        if (currentUser && Object.keys(currentUser).length > 0) {
            console.log("Initializing profile data from currentUser:", currentUser);
            setProfileData({
                firstName: currentUser.firstName || '',
                lastName: currentUser.lastName || '',
                headline: currentUser.headline || '',
                email: currentUser.email || '',
                bio: currentUser.bio || '',
                location: currentUser.location || '',
                website: currentUser.website || '',
                education: currentUser.education || [],
                experience: currentUser.experience || [],
                skills: currentUser.skills || []
            });
        }
    }, [currentUser])

    // Update profile data when viewing your own profile
    useEffect(() => {
        if (selectedUser && currentUser && selectedUser.userName === currentUser.userName) {
            console.log("Viewing own profile, updating profile data from selectedUser:", selectedUser);
            setProfileData({
                firstName: selectedUser.firstName || '',
                lastName: selectedUser.lastName || '',
                headline: selectedUser.headline || '',
                email: selectedUser.email || '',
                bio: selectedUser.bio || '',
                location: selectedUser.location || '',
                website: selectedUser.website || '',
                education: selectedUser.education || [],
                experience: selectedUser.experience || [],
                skills: selectedUser.skills || []
            });
        }
    }, [selectedUser, currentUser])

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
            // console.log("User is : ",user)
            setCurrentUser({ ...user })
            localStorage.setItem("currentuser", JSON.stringify({ ...user }))
        }
    }

    async function getSelectedUser() {
        console.log("Getting selected user for userName:", userName);
        console.log("Current user at this point:", currentUser);

        const token = await getToken()
        const res = await axios.get(`http://localhost:3000/userApp/userName/${userName}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })

        console.log("Selected user API response:", res.data);

        if (res.data.message === false) {
            console.log("Setting selected user:", res.data.payload[0]);
            setSelectedUser(res.data.payload[0])
            localStorage.setItem("selecteduser", JSON.stringify(res.data.payload[0]))

            // Check if this is the current user's profile
            if (currentUser && currentUser.userName === res.data.payload[0].userName) {
                console.log("This is the current user's profile");
            }

            isFollowing()
        } else {
            setError(res.data.err)
        }
    }

    function isFollowing() {
        let cuser = JSON.parse(localStorage.getItem("currentuser"))
        let suser = JSON.parse(localStorage.getItem("selecteduser"))
        // console.log("selected user fuck njenfibf : ",suser)
        if (cuser.following.length != 0) {
            // console.log("It runned once")
            cuser.following.forEach((e) => {
                if (e.userName === suser.userName) {
                    setAns(true)
                }
            })
        }
        if (cuser.followers.length != 0) {
            // console.log("It runned once")
            cuser.followers.forEach((e) => {
                if (e.userName === suser.userName) {
                    setMsgButton(true)
                }
            })
        }
    }

    async function addToFollowersAndFollowing() {
        // if(ans === false){
        let token = await getToken()
        let res = await axios.put(`http://localhost:3000/userApp/follow`, [currentUser, selectedUser], {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        // console.log("Payload 1 : ",res.data.payload[0])
        // console.log("Payload 2 : ",res.data.payload[1])
        if (res.data.message === true) {
            localStorage.setItem("currentuser", JSON.stringify({ ...res.data.payload[0] }))
            setCurrentUser({ ...res.data.payload[0] })
            localStorage.setItem("selecteduser", JSON.stringify({ ...res.data.payload[1] }))
            setSelectedUser({ ...res.data.payload[1] })
            setAns(true)
            let cuser = JSON.parse(localStorage.getItem("currentuser"))
            let suser = JSON.parse(localStorage.getItem("selecteduser"))
            suser.following.forEach((e) => {
                if (e.userName === cuser.userName) {
                    setMsgButton(true)
                }
            })
        }
        // }
    }

    async function handleUnfollow() {
        let token = await getToken()
        let res = await axios.put(`http://localhost:3000/userApp/unfollow`, [currentUser, selectedUser], {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        // console.log(res.data.payload)
        if (res.data.message === true) {
            localStorage.setItem("currentuser", JSON.stringify({ ...res.data.payload[0] }))
            setCurrentUser({ ...res.data.payload[0] })
            localStorage.setItem("selecteduser", JSON.stringify({ ...res.data.payload[1] }))
            setSelectedUser({ ...res.data.payload[1] })
            setAns(false)
            setMsgButton(false)
        }
    }

    async function createChat() {
        try {
            console.log("Creating chat with user:", selectedUser.userName);
            let token = await getToken()
            let res = await axios.post(`http://localhost:3000/userApp/chat`, [currentUser, selectedUser], {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (res.data.message === true) {
                console.log("Chat created successfully, preparing to navigate");

                // Get the updated user data with the new chat
                const updatedCurrentUser = { ...res.data.payload[0] }
                localStorage.setItem("currentuser", JSON.stringify(updatedCurrentUser))

                // Find the chat that was just created
                const chatInfo = updatedCurrentUser.chats.find(chat => chat.userName === selectedUser.userName)

                if (chatInfo) {
                    console.log("Found chat info:", chatInfo);

                    // Create a complete user object for the selected user with chat ID
                    const completeSelectedUser = {
                        ...selectedUser,
                        chatId: chatInfo.chatId
                    }

                    // Store the selected user in localStorage
                    localStorage.setItem("selecteduser", JSON.stringify(completeSelectedUser))

                    // Clear any previous chat errors
                    localStorage.setItem("chaterror", "")

                    // Show success message
                    toast.success("Opening chat with " + selectedUser.userName)

                    console.log("Navigating to messages page...");

                    // Navigate directly to messages page
                    window.location.href = "/messages";
                } else {
                    console.error("Chat created but couldn't find chat details");
                    toast.error("Chat created but couldn't find chat details. Please try again.")
                }
            }
        } catch (error) {
            console.error("Error creating chat:", error)
            toast.error("Failed to start conversation. Please try again.")
        }
    }

    // Handle input changes for basic profile info
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setProfileData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Save basic profile information
    const saveBasicInfo = async () => {
        try {
            setSaving(true)
            const token = await getToken()

            const response = await axios.put(
                'http://localhost:3000/userApp/profile/basic',
                {
                    userName: currentUser.userName,
                    firstName: profileData.firstName,
                    lastName: profileData.lastName,
                    headline: profileData.headline,
                    bio: profileData.bio,
                    location: profileData.location,
                    website: profileData.website,
                    phoneNumber: currentUser.phoneNumber
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            )

            if (response.status === 200) {
                console.log("Profile updated successfully:", response.data.payload);

                // Update current user with the response data
                setCurrentUser(response.data.payload)
                localStorage.setItem("currentuser", JSON.stringify(response.data.payload))

                // Exit edit mode
                setEditMode(prev => ({ ...prev, basic: false }))

                // Show success message
                toast.success("Profile updated successfully!")
            }
        } catch (error) {
            console.error("Error updating profile:", error)
            toast.error("Failed to update profile. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    // Handle resume upload
    const handleResumeUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        try {
            setUploadingResume(true)

            const formData = new FormData()
            formData.append('resume', file)
            formData.append('userName', currentUser.userName)

            const token = await getToken()
            const response = await axios.post(
                'http://localhost:3000/userApp/profile/resume',
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            )

            if (response.status === 200) {
                console.log("Resume uploaded successfully:", response.data.payload);

                // Update current user with the response data
                setCurrentUser(response.data.payload)
                localStorage.setItem("currentuser", JSON.stringify(response.data.payload))

                // Show success message
                toast.success("Resume uploaded successfully!")
            }
        } catch (error) {
            console.error("Error uploading resume:", error)
            toast.error("Failed to upload resume. Please try again.")
        } finally {
            setUploadingResume(false)
        }
    }

    // Education functions
    const openEducationModal = (education = null, index = -1) => {
        setCurrentEducation(education || {
            institution: '',
            degree: '',
            fieldOfStudy: '',
            startDate: '',
            endDate: '',
            description: ''
        })
        setEducationIndex(index)
        setShowEducationModal(true)
    }

    const handleEducationChange = (e) => {
        const { name, value } = e.target
        setCurrentEducation(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const saveEducation = async () => {
        try {
            setSaving(true)
            const token = await getToken()

            let response
            if (educationIndex === -1) {
                // Add new education
                response = await axios.post(
                    'http://localhost:3000/userApp/profile/education',
                    {
                        userName: currentUser.userName,
                        education: currentEducation
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )
            } else {
                // Update existing education
                response = await axios.put(
                    `http://localhost:3000/userApp/profile/education/${educationIndex}`,
                    {
                        userName: currentUser.userName,
                        education: currentEducation
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )
            }

            if (response.status === 200) {
                console.log("Education saved successfully:", response.data.payload);

                // Update current user with the response data
                setCurrentUser(response.data.payload)
                localStorage.setItem("currentuser", JSON.stringify(response.data.payload))

                // Update profile data
                setProfileData(prev => ({
                    ...prev,
                    education: response.data.payload.education || []
                }))

                // Close modal
                setShowEducationModal(false)

                // Show success message
                toast.success(educationIndex === -1 ? "Education added successfully!" : "Education updated successfully!")
            }
        } catch (error) {
            console.error("Error saving education:", error)
            toast.error("Failed to save education. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    const deleteEducation = async (index) => {
        try {
            setSaving(true)
            const token = await getToken()

            const response = await axios.delete(
                `http://localhost:3000/userApp/profile/education/${index}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    data: {
                        userName: currentUser.userName
                    }
                }
            )

            if (response.status === 200) {
                console.log("Education deleted successfully:", response.data.payload);

                // Update current user with the response data
                setCurrentUser(response.data.payload)
                localStorage.setItem("currentuser", JSON.stringify(response.data.payload))

                // Update profile data
                setProfileData(prev => ({
                    ...prev,
                    education: response.data.payload.education || []
                }))

                // Show success message
                toast.success("Education deleted successfully!")
            }
        } catch (error) {
            console.error("Error deleting education:", error)
            toast.error("Failed to delete education. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    // Experience functions
    const openExperienceModal = (experience = null, index = -1) => {
        setCurrentExperience(experience || {
            company: '',
            position: '',
            location: '',
            startDate: '',
            endDate: '',
            description: ''
        })
        setExperienceIndex(index)
        setShowExperienceModal(true)
    }

    const handleExperienceChange = (e) => {
        const { name, value } = e.target
        setCurrentExperience(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const saveExperience = async () => {
        try {
            setSaving(true)
            const token = await getToken()

            let response
            if (experienceIndex === -1) {
                // Add new experience
                response = await axios.post(
                    'http://localhost:3000/userApp/profile/experience',
                    {
                        userName: currentUser.userName,
                        experience: currentExperience
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )
            } else {
                // Update existing experience
                response = await axios.put(
                    `http://localhost:3000/userApp/profile/experience/${experienceIndex}`,
                    {
                        userName: currentUser.userName,
                        experience: currentExperience
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )
            }

            if (response.status === 200) {
                console.log("Experience saved successfully:", response.data.payload);

                // Update current user with the response data
                setCurrentUser(response.data.payload)
                localStorage.setItem("currentuser", JSON.stringify(response.data.payload))

                // Update profile data
                setProfileData(prev => ({
                    ...prev,
                    experience: response.data.payload.experience || []
                }))

                // Close modal
                setShowExperienceModal(false)

                // Show success message
                toast.success(experienceIndex === -1 ? "Experience added successfully!" : "Experience updated successfully!")
            }
        } catch (error) {
            console.error("Error saving experience:", error)
            toast.error("Failed to save experience. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    const deleteExperience = async (index) => {
        try {
            setSaving(true)
            const token = await getToken()

            const response = await axios.delete(
                `http://localhost:3000/userApp/profile/experience/${index}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    data: {
                        userName: currentUser.userName
                    }
                }
            )

            if (response.status === 200) {
                console.log("Experience deleted successfully:", response.data.payload);

                // Update current user with the response data
                setCurrentUser(response.data.payload)
                localStorage.setItem("currentuser", JSON.stringify(response.data.payload))

                // Update profile data
                setProfileData(prev => ({
                    ...prev,
                    experience: response.data.payload.experience || []
                }))

                // Show success message
                toast.success("Experience deleted successfully!")
            }
        } catch (error) {
            console.error("Error deleting experience:", error)
            toast.error("Failed to delete experience. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    // Skill functions
    const openSkillModal = (skill = null, index = -1) => {
        setCurrentSkill(skill || {
            name: '',
            level: 'Intermediate'
        })
        setSkillIndex(index)
        setShowSkillModal(true)
    }

    const handleSkillChange = (e) => {
        const { name, value } = e.target
        setCurrentSkill(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const saveSkill = async () => {
        try {
            setSaving(true)
            const token = await getToken()

            let response
            if (skillIndex === -1) {
                // Add new skill
                response = await axios.post(
                    'http://localhost:3000/userApp/profile/skill',
                    {
                        userName: currentUser.userName,
                        skill: currentSkill
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )
            } else {
                // Update existing skill
                response = await axios.put(
                    `http://localhost:3000/userApp/profile/skill/${skillIndex}`,
                    {
                        userName: currentUser.userName,
                        skill: currentSkill
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    }
                )
            }

            if (response.status === 200) {
                console.log("Skill saved successfully:", response.data.payload);

                // Update current user with the response data
                setCurrentUser(response.data.payload)
                localStorage.setItem("currentuser", JSON.stringify(response.data.payload))

                // Update profile data
                setProfileData(prev => ({
                    ...prev,
                    skills: response.data.payload.skills || []
                }))

                // Close modal
                setShowSkillModal(false)

                // Show success message
                toast.success(skillIndex === -1 ? "Skill added successfully!" : "Skill updated successfully!")
            }
        } catch (error) {
            console.error("Error saving skill:", error)
            toast.error("Failed to save skill. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    const deleteSkill = async (index) => {
        try {
            setSaving(true)
            const token = await getToken()

            const response = await axios.delete(
                `http://localhost:3000/userApp/profile/skill/${index}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    data: {
                        userName: currentUser.userName
                    }
                }
            )

            if (response.status === 200) {
                console.log("Skill deleted successfully:", response.data.payload);

                // Update current user with the response data
                setCurrentUser(response.data.payload)
                localStorage.setItem("currentuser", JSON.stringify(response.data.payload))

                // Update profile data
                setProfileData(prev => ({
                    ...prev,
                    skills: response.data.payload.skills || []
                }))

                // Show success message
                toast.success("Skill deleted successfully!")
            }
        } catch (error) {
            console.error("Error deleting skill:", error)
            toast.error("Failed to delete skill. Please try again.")
        } finally {
            setSaving(false)
        }
    }

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return ''
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }

    // Get skill level badge color
    const getSkillLevelColor = (level) => {
        switch (level) {
            case 'Beginner': return 'secondary'
            case 'Intermediate': return 'info'
            case 'Advanced': return 'primary'
            case 'Expert': return 'success'
            default: return 'info'
        }
    }

    return (
        <div className='container py-4'>
            {screenLoading === 1 ? (
                <div className='text-center mt-5'>
                    <Spinner animation="border" variant="primary" />
                </div>
            ) : error.length !== 0 ? (
                <div className="alert alert-danger">{error}</div>
            ) : !isSignedIn ? (
                <div className="alert alert-warning">Please sign in to access this page</div>
            ) : (
                <div className="row">
                    <div className="col-md-4 mb-4">
                        {/* Profile Card */}
                        <div className="card shadow-sm">
                            <div className="card-body text-center">
                                <img
                                    src={selectedUser.userName ? selectedUser.profileImgUrl : currentUser.profileImgUrl}
                                    className="rounded-circle mb-3"
                                    alt="Profile"
                                    style={{ width: "150px", height: "150px", objectFit: "cover" }}
                                />
                                <h4>{selectedUser.userName ? `${selectedUser.firstName} ${selectedUser.lastName}` : `${currentUser.firstName} ${currentUser.lastName}`}</h4>
                                <p className="text-muted">
                                    {selectedUser.userName ? selectedUser.headline || 'No headline' : profileData.headline || 'Add a headline'}
                                </p>

                                {/* Follow/Unfollow and Message buttons for other users */}
                                {selectedUser.userName && selectedUser.userName.length > 0 && selectedUser.userName !== currentUser.userName && (
                                    <div className="mt-3">
                                        {ans ? (
                                            <button className="btn btn-outline-dark me-2" onClick={handleUnfollow}>
                                                {loading === 1 ? <Spinner size="sm" animation="border" /> : "Unfollow"}
                                            </button>
                                        ) : (
                                            <button className="btn btn-primary me-2" onClick={addToFollowersAndFollowing}>
                                                {loading === 1 ? <Spinner size="sm" animation="border" /> : "Follow"}
                                            </button>
                                        )}

                                        {(selectedUser.accountType === "public" || msgButton) && (
                                            <button className="btn btn-outline-dark" onClick={createChat}>Message</button>
                                        )}
                                    </div>
                                )}

                                {/* Contact Info */}
                                <div className="mt-4 text-start">
                                    <h6 className="mb-3">Contact Information</h6>
                                    <p className="mb-2">
                                        <strong>Email:</strong> {selectedUser.userName ? selectedUser.email : currentUser.email}
                                    </p>
                                    <p className="mb-2">
                                        <strong>Phone:</strong> {selectedUser.userName ? selectedUser.phoneNumber : currentUser.phoneNumber}
                                    </p>
                                    {(selectedUser.userName ? selectedUser.location : profileData.location) && (
                                        <p className="mb-2">
                                            <strong>Location:</strong> {selectedUser.userName ? selectedUser.location : profileData.location}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Skills Card */}
                        <div className="card mt-4 shadow-sm">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Skills</h5>
                                {(!selectedUser.userName || selectedUser.userName === currentUser.userName) && (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => openSkillModal()}
                                    >
                                        Add Skill
                                    </button>
                                )}
                            </div>
                            <div className="card-body">
                                {(selectedUser.userName ? selectedUser.skills : profileData.skills)?.length > 0 ? (
                                    <div className="d-flex flex-wrap">
                                        {(selectedUser.userName ? selectedUser.skills : profileData.skills).map((skill, index) => (
                                            <div key={index} className={`badge bg-${getSkillLevelColor(skill.level)} me-2 mb-2 p-2`}>
                                                {skill.name}
                                                {(!selectedUser.userName || selectedUser.userName === currentUser.userName) && (
                                                    <>
                                                        <span
                                                            className="ms-2 cursor-pointer"
                                                            onClick={() => openSkillModal(skill, index)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            ✏️
                                                        </span>
                                                        <span
                                                            className="ms-1 cursor-pointer"
                                                            onClick={() => deleteSkill(index)}
                                                            style={{ cursor: 'pointer' }}
                                                        >
                                                            ❌
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted mb-0">No skills added yet</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="col-md-8">
                        {/* Basic Info Card */}
                        <div className="card mb-4 shadow-sm">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">About</h5>
                                {(!selectedUser.userName || selectedUser.userName === currentUser.userName) && (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => setEditMode(prev => ({ ...prev, basic: !prev.basic }))}
                                    >
                                        {editMode.basic ? 'Cancel' : 'Edit'}
                                    </button>
                                )}
                            </div>
                            <div className="card-body">
                                {(!selectedUser.userName || selectedUser.userName === currentUser.userName) && editMode.basic ? (
                                    <form>
                                        <div className="row mb-3">
                                            <div className="col-md-6">
                                                <label className="form-label">First Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="firstName"
                                                    value={profileData.firstName}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Last Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="lastName"
                                                    value={profileData.lastName}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Headline</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="headline"
                                                value={profileData.headline || ''}
                                                onChange={handleInputChange}
                                                placeholder="e.g., Software Engineer at Company"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Bio</label>
                                            <textarea
                                                className="form-control"
                                                name="bio"
                                                rows="3"
                                                value={profileData.bio || ''}
                                                onChange={handleInputChange}
                                                placeholder="Tell us about yourself"
                                            ></textarea>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Location</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="location"
                                                value={profileData.location || ''}
                                                onChange={handleInputChange}
                                                placeholder="e.g., San Francisco, CA"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={saveBasicInfo}
                                            disabled={saving}
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </form>
                                ) : (
                                    <div>
                                        <p>{selectedUser.userName ? selectedUser.bio : profileData.bio || 'No bio added yet'}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Resume Card */}
                        <div className="card mb-4 shadow-sm">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Resume</h5>
                                {(!selectedUser.userName || selectedUser.userName === currentUser.userName) && (
                                    <div>
                                        <input
                                            type="file"
                                            ref={resumeFileRef}
                                            className="d-none"
                                            onChange={handleResumeUpload}
                                            accept=".pdf,.doc,.docx"
                                        />
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => resumeFileRef.current.click()}
                                            disabled={uploadingResume}
                                        >
                                            {uploadingResume ? 'Uploading...' : 'Upload Resume'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="card-body">
                                {(selectedUser.userName ? selectedUser.resumeUrl : currentUser.resumeUrl) ? (
                                    <div className="d-flex align-items-center">
                                        <div className="me-3">📄</div>
                                        <div>
                                            <p className="mb-1">Resume</p>
                                            <a
                                                href={selectedUser.userName ? selectedUser.resumeUrl : currentUser.resumeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="btn btn-sm btn-outline-primary"
                                            >
                                                View Resume
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-muted mb-0">No resume uploaded yet</p>
                                )}
                            </div>
                        </div>

                        {/* Education Card */}
                        <div className="card mb-4 shadow-sm">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Education</h5>
                                {(!selectedUser.userName || selectedUser.userName === currentUser.userName) && (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => openEducationModal()}
                                    >
                                        Add Education
                                    </button>
                                )}
                            </div>
                            <div className="card-body">
                                {(selectedUser.userName ? selectedUser.education : profileData.education)?.length > 0 ? (
                                    <div>
                                        {(selectedUser.userName ? selectedUser.education : profileData.education).map((edu, index) => (
                                            <div key={index} className={index > 0 ? "mt-3 pt-3 border-top" : ""}>
                                                <div className="d-flex justify-content-between">
                                                    <h6>{edu.institution}</h6>
                                                    {(!selectedUser.userName || selectedUser.userName === currentUser.userName) && (
                                                        <div>
                                                            <button
                                                                className="btn btn-sm btn-link text-primary"
                                                                onClick={() => openEducationModal(edu, index)}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-link text-danger"
                                                                onClick={() => deleteEducation(index)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="mb-1">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</p>
                                                {(edu.startDate || edu.endDate) && (
                                                    <p className="text-muted mb-1">
                                                        {formatDate(edu.startDate)} - {edu.endDate ? formatDate(edu.endDate) : 'Present'}
                                                    </p>
                                                )}
                                                {edu.description && <p className="mb-0">{edu.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted mb-0">No education added yet</p>
                                )}
                            </div>
                        </div>

                        {/* Experience Card */}
                        <div className="card mb-4 shadow-sm">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">Work Experience</h5>
                                {(!selectedUser.userName || selectedUser.userName === currentUser.userName) && (
                                    <button
                                        className="btn btn-sm btn-primary"
                                        onClick={() => openExperienceModal()}
                                    >
                                        Add Experience
                                    </button>
                                )}
                            </div>
                            <div className="card-body">
                                {(selectedUser.userName ? selectedUser.experience : profileData.experience)?.length > 0 ? (
                                    <div>
                                        {(selectedUser.userName ? selectedUser.experience : profileData.experience).map((exp, index) => (
                                            <div key={index} className={index > 0 ? "mt-3 pt-3 border-top" : ""}>
                                                <div className="d-flex justify-content-between">
                                                    <h6>{exp.position}</h6>
                                                    {(!selectedUser.userName || selectedUser.userName === currentUser.userName) && (
                                                        <div>
                                                            <button
                                                                className="btn btn-sm btn-link text-primary"
                                                                onClick={() => openExperienceModal(exp, index)}
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-link text-danger"
                                                                onClick={() => deleteExperience(index)}
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="mb-1">{exp.company} {exp.location && `• ${exp.location}`}</p>
                                                {(exp.startDate || exp.endDate) && (
                                                    <p className="text-muted mb-1">
                                                        {formatDate(exp.startDate)} - {exp.endDate ? formatDate(exp.endDate) : 'Present'}
                                                    </p>
                                                )}
                                                {exp.description && <p className="mb-0">{exp.description}</p>}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted mb-0">No work experience added yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Education Modal */}
            <Modal show={showEducationModal} onHide={() => setShowEducationModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{educationIndex === -1 ? 'Add Education' : 'Edit Education'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Institution</Form.Label>
                            <Form.Control
                                type="text"
                                name="institution"
                                value={currentEducation?.institution || ''}
                                onChange={handleEducationChange}
                                placeholder="e.g., Stanford University"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Degree</Form.Label>
                            <Form.Control
                                type="text"
                                name="degree"
                                value={currentEducation?.degree || ''}
                                onChange={handleEducationChange}
                                placeholder="e.g., Bachelor of Science"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Field of Study</Form.Label>
                            <Form.Control
                                type="text"
                                name="fieldOfStudy"
                                value={currentEducation?.fieldOfStudy || ''}
                                onChange={handleEducationChange}
                                placeholder="e.g., Computer Science"
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={currentEducation?.startDate ? new Date(currentEducation.startDate).toISOString().split('T')[0] : ''}
                                        onChange={handleEducationChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>End Date (or expected)</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={currentEducation?.endDate ? new Date(currentEducation.endDate).toISOString().split('T')[0] : ''}
                                        onChange={handleEducationChange}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={currentEducation?.description || ''}
                                onChange={handleEducationChange}
                                placeholder="Describe your studies, achievements, etc."
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEducationModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={saveEducation} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Experience Modal */}
            <Modal show={showExperienceModal} onHide={() => setShowExperienceModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{experienceIndex === -1 ? 'Add Experience' : 'Edit Experience'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Position</Form.Label>
                            <Form.Control
                                type="text"
                                name="position"
                                value={currentExperience?.position || ''}
                                onChange={handleExperienceChange}
                                placeholder="e.g., Software Engineer"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Company</Form.Label>
                            <Form.Control
                                type="text"
                                name="company"
                                value={currentExperience?.company || ''}
                                onChange={handleExperienceChange}
                                placeholder="e.g., Google"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Location</Form.Label>
                            <Form.Control
                                type="text"
                                name="location"
                                value={currentExperience?.location || ''}
                                onChange={handleExperienceChange}
                                placeholder="e.g., Mountain View, CA"
                            />
                        </Form.Group>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Start Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="startDate"
                                        value={currentExperience?.startDate ? new Date(currentExperience.startDate).toISOString().split('T')[0] : ''}
                                        onChange={handleExperienceChange}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>End Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="endDate"
                                        value={currentExperience?.endDate ? new Date(currentExperience.endDate).toISOString().split('T')[0] : ''}
                                        onChange={handleExperienceChange}
                                    />
                                    <Form.Text className="text-muted">
                                        Leave blank if this is your current position
                                    </Form.Text>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Description</Form.Label>
                            <Form.Control
                                as="textarea"
                                rows={3}
                                name="description"
                                value={currentExperience?.description || ''}
                                onChange={handleExperienceChange}
                                placeholder="Describe your responsibilities and achievements"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowExperienceModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={saveExperience} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Skill Modal */}
            <Modal show={showSkillModal} onHide={() => setShowSkillModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{skillIndex === -1 ? 'Add Skill' : 'Edit Skill'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Skill Name</Form.Label>
                            <Form.Control
                                type="text"
                                name="name"
                                value={currentSkill?.name || ''}
                                onChange={handleSkillChange}
                                placeholder="e.g., JavaScript"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Proficiency Level</Form.Label>
                            <Form.Select
                                name="level"
                                value={currentSkill?.level || 'Intermediate'}
                                onChange={handleSkillChange}
                            >
                                <option value="Beginner">Beginner</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                                <option value="Expert">Expert</option>
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowSkillModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={saveSkill} disabled={saving}>
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ToastContainer />
        </div>
    )
}

export default UserProfile
