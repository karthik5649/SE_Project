import React, { useContext, useEffect, useState } from 'react';
import { currentUserContextObj } from '../context/currentUserContext';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

function Followers() {
  const { currentUser } = useContext(currentUserContextObj);
  const [show, setShow] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleClose = () => setShow(false);
  const handleShow = () => {
    setShow(true);
    loadFollowers();
  };

  const loadFollowers = async () => {
    try {
      setLoading(true);
      // Use the current user's followers list
      if (currentUser && currentUser.followers && currentUser.followers.length > 0) {
        setFollowers(currentUser.followers);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading followers:", error);
      setLoading(false);
    }
  };

  const viewProfile = (follower) => {
    // Store the selected user in localStorage
    localStorage.setItem("selecteduser", JSON.stringify(follower));
    // Close the modal
    handleClose();
    // Navigate to the user's profile
    navigate(`/userprofile/${follower.userName}`);
  };

  return (
    <>
      <Button variant="link" className="text-white text-decoration-none" onClick={handleShow}>
        Followers ({currentUser?.followers?.length || 0})
      </Button>

      <Modal show={show} onHide={handleClose} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>Followers</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : followers.length === 0 ? (
            <p className="text-center text-muted">You don't have any followers yet.</p>
          ) : (
            followers.map((follower) => (
              <div 
                key={follower.userName} 
                className="d-flex align-items-center p-2 mb-2 border-bottom"
                style={{ cursor: 'pointer' }}
                onClick={() => viewProfile(follower)}
              >
                <img 
                  src={follower.profileImgUrl} 
                  alt={follower.userName} 
                  className="rounded-circle me-3" 
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                />
                <div>
                  <h6 className="mb-0">{follower.userName}</h6>
                  <p className="text-muted mb-0">{follower.firstName} {follower.lastName}</p>
                </div>
              </div>
            ))
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Followers;
