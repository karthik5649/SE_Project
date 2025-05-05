import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentUserContextObj } from '../context/currentUserContext';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Spinner, Button, Card, Modal, ListGroup, Badge } from 'react-bootstrap';
import { FaPlus, FaSearch, FaUsers, FaUserPlus, FaComments } from 'react-icons/fa';

function Community() {
  const { currentUser, setCurrentUser } = useContext(currentUserContextObj);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [userCommunities, setUserCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');

  // Initialize socket connection
  const socket = useMemo(() => io('http://localhost:3000'), []);

  // Reference for the messages container
  const messagesEndRef = React.useRef(null);

  // Function to scroll to the bottom of messages
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Set current user from localStorage
    const storedUser = localStorage.getItem("currentuser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        console.log("Current user set from localStorage:", parsedUser);
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    }
  }, []);

  // Separate useEffect for fetching communities after currentUser is set
  useEffect(() => {
    if (currentUser && currentUser.userName) {
      console.log("Fetching communities for user:", currentUser.userName);
      fetchUserCommunities();
    }
  }, [currentUser]);

  // Socket.io event listeners
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    socket.on('receive_community_message', (data) => {
      if (selectedCommunity && data.communityId === selectedCommunity.group_id) {
        setMessages(prevMessages => [...prevMessages, data.message]);
        // Scroll to bottom when new message is received
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => {
      // Clean up socket listeners on component unmount
      socket.off('connect');
      socket.off('receive_community_message');
    };
  }, [selectedCommunity]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch user's communities
  const fetchUserCommunities = async () => {
    try {
      setLoading(true);
      console.log("Starting to fetch communities");

      if (!currentUser || !currentUser.userName) {
        console.error("Cannot fetch communities: currentUser or userName is missing");
        setLoading(false);
        return;
      }

      const token = await getToken();
      if (!token) {
        console.error("Cannot fetch communities: No authentication token available");
        setLoading(false);
        return;
      }

      console.log(`Fetching communities for user: ${currentUser.userName}`);
      const response = await axios.get(`http://localhost:3000/communityApp/user/${currentUser.userName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Communities fetched:", response.data);
      setUserCommunities(response.data.payload);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching communities:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      setLoading(false);
    }
  };

  // Create a new community
  async function handleCreateCommunity(formData, event) {
    try {
      // Prevent default form submission behavior
      if (event) event.preventDefault();

      console.log("Form submission event triggered");
      console.log("Creating community with data:", formData);

      // Validate form data
      if (!formData.groupName || !formData.description) {
        console.error("Missing required fields");
        alert("Please fill in all required fields");
        return;
      }

      // Get current user from localStorage to ensure we have the latest data
      let cuser;
      try {
        cuser = JSON.parse(localStorage.getItem("currentuser"));
        console.log("User from localStorage:", cuser);
        if (!cuser || !cuser.userName) {
          throw new Error("User data not found");
        }
      } catch (error) {
        console.error("Error getting user from localStorage:", error);
        alert("Please make sure you are logged in properly");
        return;
      }

      // Get authentication token
      const token = await getToken();
      if (!token) {
        console.error("Failed to get authentication token");
        alert("Authentication failed. Please try logging in again.");
        return;
      }

      // Prepare community data
      const communityData = {
        groupName: formData.groupName,
        creatorName: cuser.userName,
        creator_id: cuser.userName,
        description: formData.description,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      console.log("Sending community data:", communityData);

      // Make API request
      const response = await axios.post('http://localhost:3000/communityApp/create', communityData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Response received:", response.data);

      // Update UI
      setUserCommunities(prev => [...prev, response.data.payload]);

      // Close modal
      setShowCreateModal(false);

      // Show success message
      alert("Community created successfully!");

      // Refresh communities list
      fetchUserCommunities();

    } catch (error) {
      console.error('Error creating community:', error);

      // Show detailed error message
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        alert(`Failed to create community: ${error.response.data.message || error.message}`);
      } else {
        alert(`Failed to create community: ${error.message}`);
      }
    }
  };

  // Search for communities
  const handleSearchCommunities = async (data) => {
    try {
      console.log("Searching for communities with query:", data.searchQuery);
      setSearchLoading(true);

      // Validate search query
      if (!data.searchQuery || !data.searchQuery.trim()) {
        alert("Please enter a search term");
        setSearchLoading(false);
        return;
      }

      // Get authentication token
      const token = await getToken();
      if (!token) {
        console.error("Failed to get authentication token");
        alert("Authentication failed. Please try logging in again.");
        setSearchLoading(false);
        return;
      }

      console.log("Making search request to API");
      const response = await axios.get(`http://localhost:3000/communityApp/search/${data.searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Search results:", response.data);
      setSearchResults(response.data.payload || []);

      // Keep the modal open
      setShowJoinModal(true);
      setSearchLoading(false);

      // Clear the search input
      const searchInput = document.querySelector('input[name="searchQuery"]');
      if (searchInput) searchInput.value = '';

    } catch (error) {
      console.error('Error searching communities:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      alert(`Error searching communities: ${error.message}`);
      setSearchLoading(false);
    }
  };

  // Join a community
  const handleJoinCommunity = async (communityId) => {
    try {
      const token = await getToken();

      const response = await axios.post(`http://localhost:3000/communityApp/join/${communityId}`, {
        userName: currentUser.userName,
        userId: currentUser.userName
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Add the joined community to user's communities
      setUserCommunities(prev => [...prev, response.data.payload]);

      // Close the modal
      setShowJoinModal(false);

    } catch (error) {
      console.error('Error joining community:', error);
    }
  };

  // Select a community to view
  const handleSelectCommunity = async (community) => {
    setSelectedCommunity(community);

    try {
      const token = await getToken();

      // Fetch the latest community data
      const response = await axios.get(`http://localhost:3000/communityApp/${community.group_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSelectedCommunity(response.data.payload);
      setMessages(response.data.payload.messages || []);

      // Join the socket room for this community
      socket.emit('join_community', community.group_id);

      // Scroll to bottom after a short delay to ensure the messages are rendered
      setTimeout(scrollToBottom, 300);

    } catch (error) {
      console.error('Error fetching community details:', error);
    }
  };

  // Check if current user is an admin of the selected community
  const isAdmin = () => {
    if (!selectedCommunity || !currentUser) return false;

    return selectedCommunity.members.some(
      member => member.member_id === currentUser.userName && member.isAdmin === "yes"
    );
  };

  // Send a message to the community
  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedCommunity) return;

    // Only admins can send messages
    if (!isAdmin()) {
      alert("Only admins can send messages in this community");
      return;
    }

    // Create the message object
    const newMessage = {
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      message: messageInput,
      sender: currentUser.userName,
      sender_id: currentUser.userName,
      time: Date.now().toString()
    };

    // Emit the message via socket.io
    socket.emit('send_community_message', {
      communityId: selectedCommunity.group_id,
      message: newMessage
    });

    // Also send to the server to save in the database
    sendMessageToServer(newMessage);

    // Clear the input
    setMessageInput('');
  };

  // Send message to server to save in database
  const sendMessageToServer = async (message) => {
    try {
      const token = await getToken();

      const response = await axios.post(`http://localhost:3000/communityApp/message/${selectedCommunity.group_id}`, message, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log("Message saved to server:", response.data);

      // Scroll to bottom after sending the message
      setTimeout(scrollToBottom, 100);

    } catch (error) {
      console.error('Error sending message to server:', error);

      if (error.response && error.response.status === 403) {
        alert("Only admins can send messages in this community");
      } else {
        alert(`Error sending message: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  // Back to communities list
  const handleBackToCommunities = () => {
    setSelectedCommunity(null);
    // Leave the socket room
    if (selectedCommunity) {
      socket.emit('leave_community', selectedCommunity.group_id);
    }
  };

  return (
    <div className="container mt-4">
      {loading ? (
        <div className="d-flex justify-content-center mt-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          {!selectedCommunity ? (
            // Communities List View
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Communities</h1>
                <div>
                  <Button
                    variant="primary"
                    className="me-2"
                    onClick={() => setShowCreateModal(true)}
                  >
                    <FaPlus className="me-2" /> Create Community
                  </Button>
                  <Button
                    variant="outline-primary"
                    onClick={() => setShowJoinModal(true)}
                  >
                    <FaSearch className="me-2" /> Find Communities
                  </Button>
                </div>
              </div>

              {userCommunities.length === 0 ? (
                <div className="text-center mt-5">
                  <p className="lead">You haven't joined any communities yet.</p>
                  <p>Create a new community or search for existing ones to join!</p>
                </div>
              ) : (
                <div className="row">
                  {userCommunities.map(community => (
                    <div className="col-md-4 mb-4" key={community.group_id}>
                      <Card className="h-100 shadow-sm">
                        <Card.Body>
                          <Card.Title>{community.groupName}</Card.Title>
                          <Card.Subtitle className="mb-2 text-muted">
                            Created by: {community.creatorName}
                          </Card.Subtitle>
                          <Card.Text>
                            {community.description}
                          </Card.Text>
                          <div className="mb-2">
                            {community.tags && community.tags.map(tag => (
                              <Badge bg="secondary" className="me-1" key={tag}>
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <div className="d-flex justify-content-between">
                            <small className="text-muted">
                              <FaUsers className="me-1" /> {community.members ? community.members.length : 0} members
                            </small>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleSelectCommunity(community)}
                            >
                              <FaComments className="me-1" /> Open
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Community Detail View
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <Button
                    variant="outline-secondary"
                    className="me-2"
                    onClick={handleBackToCommunities}
                  >
                    Back to Communities
                  </Button>
                  <h2 className="d-inline-block">{selectedCommunity.groupName}</h2>
                </div>
                <div>
                  <Badge bg="info" className="me-2">
                    <FaUsers className="me-1" /> {selectedCommunity.members ? selectedCommunity.members.length : 0} members
                  </Badge>
                </div>
              </div>

              <div className="row">
                <div className="col-md-8">
                  {/* Messages Section */}
                  <Card className="mb-3">
                    <Card.Header>Community Chat</Card.Header>
                    <Card.Body style={{ height: '400px', overflowY: 'auto' }}>
                      {messages.length === 0 ? (
                        <p className="text-center text-muted">No messages yet. Be the first to say hello!</p>
                      ) : (
                        <ListGroup variant="flush">
                          {messages.map(msg => (
                            <ListGroup.Item
                              key={msg.message_id}
                              className={`border-0 ${msg.sender_id === currentUser.userName ? 'text-end' : ''}`}
                            >
                              <div>
                                <small className="text-muted">
                                  {msg.sender_id === currentUser.userName ? 'You' : msg.sender}
                                </small>
                              </div>

                              <div className={`d-inline-block p-2 rounded ${msg.sender_id === currentUser.userName
                                ? 'bg-primary text-white'
                                : 'bg-light'
                                }`}>
                                {msg.message}
                              </div>

                              <div>
                                <small className="text-muted">
                                  {new Date(parseInt(msg.time)).toLocaleTimeString()}
                                </small>
                              </div>
                            </ListGroup.Item>
                          ))}
                          <div ref={messagesEndRef} />
                        </ListGroup>
                      )}
                    </Card.Body>
                    <Card.Footer>
                      {isAdmin() ? (
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Type your message..."
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          />
                          <Button
                            variant="primary"
                            onClick={handleSendMessage}
                            disabled={!messageInput.trim()}
                          >
                            Send
                          </Button>
                        </div>
                      ) : (
                        <p className="text-center text-muted mb-0">
                          Only admins can send messages in this community
                        </p>
                      )}
                    </Card.Footer>
                  </Card>
                </div>

                <div className="col-md-4">
                  {/* Community Info Section */}
                  <Card className="mb-3">
                    <Card.Header>About this Community</Card.Header>
                    <Card.Body>
                      <p>{selectedCommunity.description}</p>
                      <p><strong>Created by:</strong> {selectedCommunity.creatorName}</p>
                      <p><strong>Created:</strong> {new Date(parseInt(selectedCommunity.time)).toLocaleDateString()}</p>

                      <div className="mb-3">
                        <strong>Tags:</strong><br />
                        {selectedCommunity.tags && selectedCommunity.tags.map(tag => (
                          <Badge bg="secondary" className="me-1 mt-1" key={tag}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>

                  {/* Members Section */}
                  <Card>
                    <Card.Header>Members</Card.Header>
                    <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      <ListGroup variant="flush">
                        {selectedCommunity.members && selectedCommunity.members.map(member => (
                          <ListGroup.Item key={member.member_id} className="d-flex justify-content-between align-items-center">
                            {member.memberName}
                            {member.isAdmin === "yes" && (
                              <Badge bg="danger">Admin</Badge>
                            )}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Card.Body>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Create Community Modal */}
          <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Create New Community</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form
                id="createCommunityForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  console.log("Form submitted directly");
                  const formData = {
                    groupName: document.querySelector('input[name="groupName"]').value,
                    description: document.querySelector('textarea[name="description"]').value,
                    tags: document.querySelector('input[name="tags"]').value
                  };
                  if (formData.groupName && formData.description) {
                    handleCreateCommunity(formData, e);
                  } else {
                    alert("Please fill in all required fields");
                  }
                }}>

                <div className="mb-3">
                  <label className='form-label'>Community Name</label>
                  <input
                    className='form-control'
                    type="text"
                    name="groupName"
                    placeholder="Enter community name"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className='form-label'>Description</label>
                  <textarea
                    className='form-control'
                    rows={3}
                    name="description"
                    placeholder="Describe your community"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className='form-label'>Tags (comma separated)</label>
                  <input
                    className='form-control'
                    type="text"
                    name="tags"
                    placeholder="e.g. study, programming, music"
                  />
                </div>

                <div className='d-flex justify-content-end'>
                  <button
                    className='mx-2 btn btn-secondary'
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className='mx-2 btn btn-primary'
                    type='button'
                    onClick={(e) => {
                      e.preventDefault();
                      console.log("Submit button clicked directly");
                      const formData = {
                        groupName: document.querySelector('input[name="groupName"]').value,
                        description: document.querySelector('textarea[name="description"]').value,
                        tags: document.querySelector('input[name="tags"]').value
                      };
                      if (formData.groupName && formData.description) {
                        handleCreateCommunity(formData);
                      } else {
                        alert("Please fill in all required fields");
                      }
                    }}
                  >
                    Create Community
                  </button>
                </div>
              </form>
            </Modal.Body>
          </Modal>

          {/* Join Community Modal */}
          <Modal show={showJoinModal} onHide={() => setShowJoinModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Find Communities</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <form
                className="mb-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const searchQuery = document.querySelector('input[name="searchQuery"]').value;
                  if (searchQuery.trim()) {
                    handleSearchCommunities({ searchQuery });
                  } else {
                    alert("Please enter a search term");
                  }
                }}
              >
                <div className="input-group">
                  <input
                    className="form-control"
                    type="text"
                    name="searchQuery"
                    placeholder="Search communities..."
                  />
                  <button
                    className="btn btn-primary"
                    type="button"
                    disabled={searchLoading}
                    onClick={(e) => {
                      e.preventDefault();
                      const searchQuery = document.querySelector('input[name="searchQuery"]').value;
                      if (searchQuery.trim()) {
                        handleSearchCommunities({ searchQuery });
                      } else {
                        alert("Please enter a search term");
                      }
                    }}
                  >
                    {searchLoading ? <Spinner animation="border" size="sm" /> : <FaSearch />}
                  </button>
                </div>
              </form>

              {searchResults.length > 0 ? (
                <ListGroup>
                  {searchResults.map(community => (
                    <ListGroup.Item
                      key={community.group_id}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <h5>{community.groupName}</h5>
                        <p className="mb-1">{community.description}</p>
                        <small className="text-muted">
                          <FaUsers className="me-1" /> {community.members ? community.members.length : 0} members
                        </small>
                      </div>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleJoinCommunity(community.group_id)}
                        disabled={userCommunities.some(c => c.group_id === community.group_id)}
                      >
                        {userCommunities.some(c => c.group_id === community.group_id) ? 'Joined' : <><FaUserPlus className="me-1" /> Join</>}
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-center text-muted">
                  {searchLoading ? 'Searching...' : 'Search for communities to join'}
                </p>
              )}
            </Modal.Body>
          </Modal>
        </>
      )}
    </div>
  );
}

export default Community;
