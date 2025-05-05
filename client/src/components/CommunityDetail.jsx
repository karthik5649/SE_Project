import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { currentUserContextObj } from '../context/currentUserContext';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { Spinner, Button, Card, ListGroup, Badge } from 'react-bootstrap';
import { FaArrowLeft, FaUsers, FaUserPlus, FaUserMinus } from 'react-icons/fa';

function CommunityDetail() {
  const { currentUser } = useContext(currentUserContextObj);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const communityId = searchParams.get('id');
  
  const [community, setCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [isMember, setIsMember] = useState(false);
  
  // Initialize socket connection
  const socket = useMemo(() => io('http://localhost:3000'), []);
  
  useEffect(() => {
    // Fetch community details
    fetchCommunityDetails();
    
    // Socket.io event listeners
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });
    
    socket.on('receive_community_message', (data) => {
      if (data.communityId === communityId) {
        setMessages(prevMessages => [...prevMessages, data.message]);
      }
    });
    
    // Join the socket room for this community
    if (communityId) {
      socket.emit('join_community', communityId);
    }
    
    return () => {
      // Clean up socket listeners on component unmount
      socket.off('connect');
      socket.off('receive_community_message');
      
      // Leave the socket room
      if (communityId) {
        socket.emit('leave_community', communityId);
      }
    };
  }, [communityId]);
  
  // Fetch community details
  const fetchCommunityDetails = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await axios.get(`http://localhost:3000/communityApp/${communityId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setCommunity(response.data.payload);
      setMessages(response.data.payload.messages || []);
      
      // Check if current user is a member
      if (response.data.payload.members && currentUser) {
        const userIsMember = response.data.payload.members.some(
          member => member.member_id === currentUser.userName
        );
        setIsMember(userIsMember);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching community details:', error);
      setLoading(false);
    }
  };
  
  // Send a message to the community
  const handleSendMessage = () => {
    if (!messageInput.trim() || !community || !isMember) return;
    
    const newMessage = {
      message_id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      message: messageInput,
      sender: currentUser.userName,
      sender_id: currentUser.userName,
      time: Date.now().toString()
    };
    
    // Emit the message via socket.io
    socket.emit('send_community_message', {
      communityId: communityId,
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
      
      await axios.post(`http://localhost:3000/communityApp/message/${communityId}`, message, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
    } catch (error) {
      console.error('Error sending message to server:', error);
    }
  };
  
  // Join the community
  const handleJoinCommunity = async () => {
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
      
      // Update the community state with the new member
      setCommunity(response.data.payload);
      setIsMember(true);
      
    } catch (error) {
      console.error('Error joining community:', error);
    }
  };
  
  // Leave the community
  const handleLeaveCommunity = async () => {
    try {
      const token = await getToken();
      
      const response = await axios.post(`http://localhost:3000/communityApp/leave/${communityId}`, {
        userId: currentUser.userName
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Update the community state without the member
      setCommunity(response.data.payload);
      setIsMember(false);
      
    } catch (error) {
      console.error('Error leaving community:', error);
    }
  };
  
  // Go back to communities list
  const handleBackToCommunities = () => {
    navigate('/communities');
  };

  return (
    <div className="container mt-4">
      {loading ? (
        <div className="d-flex justify-content-center mt-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : community ? (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Button 
                variant="outline-secondary" 
                className="me-2"
                onClick={handleBackToCommunities}
              >
                <FaArrowLeft className="me-1" /> Back to Communities
              </Button>
              <h2 className="d-inline-block">{community.groupName}</h2>
            </div>
            <div>
              {isMember ? (
                <Button 
                  variant="outline-danger" 
                  onClick={handleLeaveCommunity}
                >
                  <FaUserMinus className="me-1" /> Leave Community
                </Button>
              ) : (
                <Button 
                  variant="outline-success" 
                  onClick={handleJoinCommunity}
                >
                  <FaUserPlus className="me-1" /> Join Community
                </Button>
              )}
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
                          className={`border-0 ${msg.sender_id === currentUser?.userName ? 'text-end' : ''}`}
                        >
                          <div>
                            <small className="text-muted">
                              {msg.sender_id === currentUser?.userName ? 'You' : msg.sender}
                            </small>
                          </div>
                          <div className={`d-inline-block p-2 rounded ${
                            msg.sender_id === currentUser?.userName 
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
                    </ListGroup>
                  )}
                </Card.Body>
                <Card.Footer>
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder={isMember ? "Type your message..." : "Join the community to send messages"} 
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={!isMember}
                    />
                    <Button 
                      variant="primary" 
                      onClick={handleSendMessage}
                      disabled={!isMember}
                    >
                      Send
                    </Button>
                  </div>
                </Card.Footer>
              </Card>
            </div>
            
            <div className="col-md-4">
              {/* Community Info Section */}
              <Card className="mb-3">
                <Card.Header>About this Community</Card.Header>
                <Card.Body>
                  <p>{community.description}</p>
                  <p><strong>Created by:</strong> {community.creatorName}</p>
                  <p><strong>Created:</strong> {new Date(parseInt(community.time)).toLocaleDateString()}</p>
                  
                  <div className="mb-3">
                    <strong>Tags:</strong><br />
                    {community.tags && community.tags.map(tag => (
                      <Badge bg="secondary" className="me-1 mt-1" key={tag}>
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </Card.Body>
              </Card>
              
              {/* Members Section */}
              <Card>
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <span>Members</span>
                    <Badge bg="info">
                      <FaUsers className="me-1" /> {community.members ? community.members.length : 0}
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <ListGroup variant="flush">
                    {community.members && community.members.map(member => (
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
      ) : (
        <div className="text-center mt-5">
          <p className="lead text-danger">Community not found or you don't have access.</p>
          <Button 
            variant="primary" 
            onClick={handleBackToCommunities}
          >
            Back to Communities
          </Button>
        </div>
      )}
    </div>
  );
}

export default CommunityDetail;
