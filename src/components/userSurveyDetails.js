import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import { Header, Footer } from './HeaderFooter';
import Navbar from './navbar';

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5); // State for limit
  const [tempLimit, setTempLimit] = useState(5); // Temporary limit for user input
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = useCallback(
    async (pageNum, reset = false, query = '', currentUsers = [], fetchLimit = limit) => {
      setLoading(true);
      setError('');

      try {
        const isMobileSearch = /^\d+$/.test(query);
        const response = await axios.post(
          'https://babralaapi-d3fpaphrckejgdd5.centralindia-01.azurewebsites.net/auth/getAllUsersWithRoleslimit',
          {
            mobileNumber: isMobileSearch ? query : null,
            limit: fetchLimit * pageNum,
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.data.success) {
          let fetchedUsers = response.data.users;

          if (query && !isMobileSearch) {
            const lowerQuery = query.toLowerCase();
            fetchedUsers = fetchedUsers.filter((user) =>
              user.username?.toLowerCase().includes(lowerQuery)
            );
          }

          fetchedUsers.sort((a, b) => a.username.localeCompare(b.username));

          if (reset) {
            setUsers(fetchedUsers);
          } else {
            const newUsers = [...currentUsers, ...fetchedUsers.slice(currentUsers.length)];
            newUsers.sort((a, b) => a.username.localeCompare(b.username));
            setUsers(newUsers);
          }

          setHasMore(fetchedUsers.length === fetchLimit * pageNum);
        } else {
          setError(response.data.message || 'No users found');
          setHasMore(false);
        }
      } catch (err) {
        setError('Failed to fetch users. Please try again.');
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchUsers(1, true, '', []);
  }, [fetchUsers]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers(1, true, searchQuery, []);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchUsers(nextPage, false, searchQuery, users, tempLimit); // Use tempLimit here
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      const previousPage = page - 1;
      setPage(previousPage);
      fetchUsers(previousPage, true, searchQuery, [], tempLimit); // Fetch users for the previous page
    }
  };

  const handleEdit = (mobileNumber) => {
    navigate('/SurveyData', {
      state: { mobileNumber },
    });
  };

  const handleLimitChange = (newLimit) => {
    setTempLimit(newLimit); // Update the temporary limit
  };

  return (
    <div>
      <Header />
      <Navbar />
      <div className="users-list-container">
        <h1>Users Details</h1>

        {/* Search Section */}
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Enter Mobile Number or Username"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              disabled={loading}
            />
            <button type="submit" className="search-button" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        

        {/* Status */}
        {loading && <div className="loading">Loading users...</div>}
        {error && <div className="error">{error}</div>}

        {/* Users Table */}
        {!loading && users.length > 0 && (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Mobile Number</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Admin</th>
                  <th>Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.userID}>
                    <td>{user.username}</td>
                    <td>
                      {`${(user.FirstName || '').trim()} ${(user.MiddleName || '').trim()} ${(user.LastName || '').trim()}`.trim()}
                    </td>
                    <td>{user.mobileNumber}</td>
                    <td>{user.emailID || 'N/A'}</td>
                    <td>{user.roles.join(', ') || 'No roles'}</td>
                    <td>{user.isAdmin ? 'Yes' : 'No'}</td>
                    <td>{user.isActive ? 'Yes' : 'No'}</td>
                    <td>
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(user.mobileNumber)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && users.length === 0 && !error && (
          <div className="no-results">No users found</div>
        )}

        {/* Pagination Controls */}
        
          

          <div className="pagination-buttons">
            <button
              className="previous-button"
              onClick={() => handlePreviousPage()}
              disabled={loading || page === 1}
            >
              Previous Page
            </button>

                <p>
                Page: <strong>{page}</strong>
              </p>

              {/* Limit Section */}
            <div className="limit-section">
              <label htmlFor="limit-input">Set Limit:</label>
              <input
                id="limit-input"
                type="number"
                value={tempLimit}
                onChange={(e) => handleLimitChange(Number(e.target.value))}
                className="limit-input"
                min="1"
                disabled={loading}
              />
            </div>

                {!loading && hasMore && (
                  <button
                    className="more-button"
                    onClick={handleLoadMore}
                    disabled={loading}
                  >
                    Load More
                  </button>
                )}
              </div>
          </div>
        
      <Footer />
    </div>
  );
};

export default UsersList;