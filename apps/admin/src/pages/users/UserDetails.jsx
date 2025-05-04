import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../../services/api';
import UserForm from '../../components/users/UserForm';
import { toast } from 'react-hot-toast';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isNew = id === 'new';

  useEffect(() => {
    if (isNew) {
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await userService.getUserById(id);
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user:', error);
        setError(error.response?.data?.message || 'Failed to load user details');
        toast.error('Error loading user details');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, isNew]);

  const handleSuccess = (result) => {
    if (isNew) {
      // Navigate to the newly created user's details page
      toast.success('User created successfully');
      navigate(`/users/${result.user._id}`);
    } else {
      // Update local state with updated user data
      setUser(result.user);
      toast.success('User updated successfully');
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !isNew) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading user</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/users')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Back to Users
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg mb-6 p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isNew ? 'Create New User' : `Edit User: ${user?.name || user?.username || id}`}
        </h1>
        {!isNew && user && (
          <div className="mt-2 text-sm text-gray-600">
            <p>ID: {user._id}</p>
            <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
            {user.lastLogin && <p>Last Login: {new Date(user.lastLogin).toLocaleString()}</p>}
          </div>
        )}
      </div>

      <UserForm 
        user={isNew ? null : user} 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
} 