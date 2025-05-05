import React, { useContext, useEffect, useState } from 'react';
import { currentUserContextObj } from '../context/currentUserContext';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

function Followings() {
  const { currentUser } = useContext(currentUserContextObj);
  const [show, setShow] = useState(false);
  const [followings, setFollowings] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { getToken } = useAuth();

  const handleClose = () => setShow(false);
  const handleShow = () => {
    setShow(true);
    loadFollowings();
  };

  const loadFollowings = async () => {
    try {
      setLoading(true);
      // Use the current user's following list
      if (currentUser && currentUser.following && currentUser.following.length > 0) {
        setFollowings(currentUser.following);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading followings:", error);
      setLoading(false);
    }
  };

  const viewProfile = (following) => {
    // Store the selected user in localStorage
    localStorage.setItem("selecteduser", JSON.stringify(following));
    // Close the modal
    handleClose();
    // Navigate to the user's profile
    navigate(`/userprofile/${following.userName}`);
  };

  return (
    <>
      <Button variant="link" className="text-white text-decoration-none" onClick={handleShow}>
        Following ({currentUser?.following?.length || 0})
      </Button>

      <Modal show={show} onHide={handleClose} centered size="md">
        <Modal.Header closeButton>
          <Modal.Title>Following</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : followings.length === 0 ? (
            <p className="text-center text-muted">You're not following anyone yet.</p>
          ) : (
            followings.map((following) => (
              <div 
                key={following.userName} 
                className="d-flex align-items-center p-2 mb-2 border-bottom"
                style={{ cursor: 'pointer' }}
                onClick={() => viewProfile(following)}
              >
                <img 
                  src={following.profileImgUrl} 
                  alt={following.userName} 
                  className="rounded-circle me-3" 
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                />
                <div>
                  <h6 className="mb-0">{following.userName}</h6>
                  <p className="text-muted mb-0">{following.firstName} {following.lastName}</p>
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

export default Followings;
