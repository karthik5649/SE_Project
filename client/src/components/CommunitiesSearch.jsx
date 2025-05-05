import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { currentUserContextObj } from '../context/currentUserContext';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { Spinner, Button, Card, ListGroup, Badge } from 'react-bootstrap';
import { FaSearch, FaUsers, FaUserPlus } from 'react-icons/fa';

function CommunitiesSearch() {
  const { currentUser } = useContext(currentUserContextObj);
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userCommunities, setUserCommunities] = useState([]);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch user's communities to check which ones they've already joined
  const fetchUserCommunities = async () => {
    try {
      const token = await getToken();

      if (currentUser && currentUser.userName) {
        const response = await axios.get(`http://localhost:3000/communityApp/user/${currentUser.userName}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        setUserCommunities(response.data.payload);
      }
    } catch (error) {
      console.error('Error fetching user communities:', error);
    }
  };

  // Search for communities
  const handleSearchCommunities = async (data) => {
    try {
      setLoading(true);
      const token = await getToken();

      // Fetch user's communities first to check which ones they've already joined
      await fetchUserCommunities();

      const response = await axios.get(`http://localhost:3000/communityApp/search/${data.searchQuery}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setSearchResults(response.data.payload);
      setLoading(false);
      reset();

    } catch (error) {
      console.error('Error searching communities:', error);
      setLoading(false);
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

      // Update the user's communities list
      setUserCommunities(prev => [...prev, response.data.payload]);

      // Show success message or notification
      alert('Successfully joined the community!');

    } catch (error) {
      console.error('Error joining community:', error);
      alert('Failed to join the community. Please try again.');
    }
  };

  // Navigate to community detail
  const handleViewCommunity = (communityId) => {
    navigate(`/communities?id=${communityId}`);
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4 text-center">Find Communities</h1>

      <div className="row mb-4">
        <div className="col-md-8 mx-auto">
          <form onSubmit={handleSubmit(handleSearchCommunities)}>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Search communities by name..."
                {...register("searchQuery", { required: true })}
              />
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : <FaSearch />}
              </Button>
            </div>
            {errors.searchQuery && <span className="text-danger">Please enter a search term</span>}
          </form>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center mt-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <div className="row">
          {searchResults.length > 0 ? (
            searchResults.map(community => (
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
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        <FaUsers className="me-1" /> {community.members ? community.members.length : 0} members
                      </small>
                      <div>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleViewCommunity(community.group_id)}
                        >
                          View
                        </Button>
                        {userCommunities.some(c => c.group_id === community.group_id) ? (
                          <Button
                            variant="success"
                            size="sm"
                            disabled
                          >
                            Joined
                          </Button>
                        ) : (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleJoinCommunity(community.group_id)}
                          >
                            <FaUserPlus className="me-1" /> Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))
          ) : (
            <div className="col-12 text-center mt-4">
              <p className="lead text-muted">
                {searchResults.length === 0 && !loading ?
                  "Search for communities to find and join them" :
                  "No communities found matching your search"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommunitiesSearch;
