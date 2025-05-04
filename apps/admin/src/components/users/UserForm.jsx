import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { userService } from '../../services/api';

export default function UserForm({ user, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const { 
    register, 
    handleSubmit, 
    reset, 
    setValue, 
    formState: { errors } 
  } = useForm({
    defaultValues: {
      email: '',
      username: '',
      name: '',
      bio: '',
      role: 'user',
      preferences: {
        unitSystem: 'metric',
        privacySettings: {
          defaultTrackPrivacy: 'public',
          defaultPhotoPrivacy: 'public',
          showLocationInProfile: true
        },
        notifications: {
          newFollower: true,
          newComment: true,
          newLike: true
        }
      }
    }
  });

  useEffect(() => {
    if (user) {
      // Set form values from user data
      const fields = [
        'email', 'username', 'name', 'bio', 'role',
        'preferences.unitSystem',
        'preferences.privacySettings.defaultTrackPrivacy',
        'preferences.privacySettings.defaultPhotoPrivacy',
        'preferences.privacySettings.showLocationInProfile',
        'preferences.notifications.newFollower',
        'preferences.notifications.newComment',
        'preferences.notifications.newLike'
      ];

      fields.forEach(field => {
        // Handle nested fields with dot notation
        const value = field.split('.').reduce((obj, key) => 
          obj && obj[key] !== undefined ? obj[key] : '', user);
        
        setValue(field, value);
      });

      // Set profile image preview if user has one
      if (user.profileImage) {
        setImagePreview(user.profileImage);
      }
    }
  }, [user, setValue]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Maximum size is 5MB');
      return;
    }

    // Validate file type
    if (!file.type.match('image.*')) {
      toast.error('Only image files are allowed');
      return;
    }

    setSelectedFile(file);

    // Create and set image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      let result;

      // If we have a profile image to upload
      if (selectedFile) {
        const formData = new FormData();
        formData.append('profileImage', selectedFile);
        
        // If updating existing user
        if (user?._id) {
          await userService.updateProfileImage(user._id, formData);
        } else {
          // If creating new user, store file to be handled after user creation
          data.profileImageFile = selectedFile;
        }
      }

      // Create or update user data
      if (user?._id) {
        // Update existing user
        result = await userService.updateUser(user._id, data);
        toast.success('User updated successfully');
      } else {
        // Create new user
        result = await userService.createUser(data);
        
        // Upload profile image if available
        if (data.profileImageFile) {
          const formData = new FormData();
          formData.append('profileImage', data.profileImageFile);
          await userService.updateProfileImage(result.user._id, formData);
        }
        
        toast.success('User created successfully');
      }

      if (onSuccess) {
        onSuccess(result);
      }

      // Reset form if creating new user
      if (!user) {
        reset();
        setImagePreview(null);
        setSelectedFile(null);
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        {/* Basic Information */}
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className={`mt-1 block w-full rounded-md border ${errors.email ? 'border-red-300' : 'border-gray-300'} shadow-sm p-2`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('username', {
                required: 'Username is required',
                pattern: {
                  value: /^[a-zA-Z0-9_]+$/,
                  message: 'Username can only contain letters, numbers and underscores'
                },
                minLength: {
                  value: 3,
                  message: 'Username must be at least 3 characters'
                }
              })}
              className={`mt-1 block w-full rounded-md border ${errors.username ? 'border-red-300' : 'border-gray-300'} shadow-sm p-2`}
            />
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('name', {
                required: 'Name is required'
              })}
              className={`mt-1 block w-full rounded-md border ${errors.name ? 'border-red-300' : 'border-gray-300'} shadow-sm p-2`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              {...register('role')}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Bio
            </label>
            <textarea
              {...register('bio')}
              rows="3"
              className={`mt-1 block w-full rounded-md border ${errors.bio ? 'border-red-300' : 'border-gray-300'} shadow-sm p-2`}
              placeholder="User bio"
            ></textarea>
            {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
          </div>
        </div>

        {/* Profile Image Upload */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Image
          </label>
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                id="profileImage"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="profileImage"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              >
                Choose Image
              </label>
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG or GIF. Max 5MB.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Preferences */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
        
        <div className="space-y-6">
          {/* Unit System */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit System
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  {...register('preferences.unitSystem')}
                  value="metric"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Metric (km, kg)</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  {...register('preferences.unitSystem')}
                  value="imperial"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Imperial (mi, lb)</span>
              </label>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Privacy Settings
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700">Default Track Privacy</label>
                <select
                  {...register('preferences.privacySettings.defaultTrackPrivacy')}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700">Default Photo Privacy</label>
                <select
                  {...register('preferences.privacySettings.defaultPhotoPrivacy')}
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="showLocationInProfile"
                  {...register('preferences.privacySettings.showLocationInProfile')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="showLocationInProfile" className="ml-2 block text-sm text-gray-700">
                  Show location in profile
                </label>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Settings
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyNewFollower"
                  {...register('preferences.notifications.newFollower')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="notifyNewFollower" className="ml-2 block text-sm text-gray-700">
                  Notify on new followers
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyNewComment"
                  {...register('preferences.notifications.newComment')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="notifyNewComment" className="ml-2 block text-sm text-gray-700">
                  Notify on new comments
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notifyNewLike"
                  {...register('preferences.notifications.newLike')}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="notifyNewLike" className="ml-2 block text-sm text-gray-700">
                  Notify on new likes
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
        >
          {loading ? 'Saving...' : user?._id ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
} 