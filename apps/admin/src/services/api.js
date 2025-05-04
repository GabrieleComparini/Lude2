import axios from 'axios';
import { auth } from '../config/firebase';

// Helper to normalize URL by removing trailing slash if present
const normalizeBaseUrl = (url) => {
  if (!url) return '';
  return url.endsWith('/') ? url.slice(0, -1) : url;
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${normalizeBaseUrl(import.meta.env.VITE_API_URL)}/api` || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const status = error.response.status;
      
      if (status === 401) {
        // Handle unauthorized access (token expired, invalid, etc.)
        // Redirect to login or refresh token
        window.location.href = '/login';
      } else if (status === 403) {
        // Handle forbidden access
        console.error('Access forbidden:', error.response.data);
      } else if (status === 404) {
        // Handle not found
        console.error('Resource not found:', error.response.data);
      } else {
        // Handle other server errors
        console.error('Server error:', error.response.data);
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject({ message: 'Non è stata ricevuta alcuna risposta dal server. Controlla la tua connessione.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      return Promise.reject({ message: 'Errore nella preparazione della richiesta.' });
    }
  }
);

// API Services
export const authService = {
  syncUser: async (token) => {
    console.log('authService.syncUser chiamato con token');
    try {
      const result = await api.post('/auth/sync', { token });
      console.log('authService.syncUser risposta:', result);
      return result;
    } catch (error) {
      console.error('authService.syncUser errore:', error);
      throw error;
    }
  },
  verifyToken: async () => {
    return api.get('/auth/verify');
  },
  createAdmin: async (data) => {
    return api.post('/auth/create-admin', data);
  },
};

export const userService = {
  getCurrentUser: async () => {
    return api.get('/users/me');
  },
  updateCurrentUser: async (data) => {
    return api.put('/users/me', data);
  },
  updateProfileImage: async (userId, formData) => {
    if (userId === 'me') {
      return api.put('/users/me/profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      return api.put(`/users/${userId}/profile-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }
  },
  getUserByUsername: async (username) => {
    return api.get(`/users/${username}`);
  },
  getUserById: async (id) => {
    return api.get(`/users/id/${id}`);
  },
  listUsers: async (params) => {
    return api.get('/users', { params });
  },
  createUser: async (userData) => {
    return api.post('/users', userData);
  },
  updateUser: async (id, userData) => {
    return api.put(`/users/${id}`, userData);
  },
  deleteUser: async (id) => {
    return api.delete(`/users/${id}`);
  },
  updateUserRole: async (id, role) => {
    return api.put(`/users/${id}/role`, { role });
  },
  followUser: async (id) => {
    return api.post(`/users/${id}/follow`);
  },
  unfollowUser: async (id) => {
    return api.post(`/users/${id}/unfollow`);
  },
  getUserConnections: async (id, type = 'all') => {
    return api.get(`/users/${id}/connections`, { params: { type } });
  },
};

export const trackService = {
  createTrack: async (data) => {
    return api.post('/tracks', data);
  },
  getTracks: async (params) => {
    return api.get('/tracks', { params });
  },
  getNearbyTracks: async (params) => {
    return api.get('/tracks/nearby', { params });
  },
  getTrackById: async (id) => {
    return api.get(`/tracks/${id}`);
  },
  updateTrack: async (id, data) => {
    return api.put(`/tracks/${id}`, data);
  },
  deleteTrack: async (id) => {
    return api.delete(`/tracks/${id}`);
  },
  addPointOfInterest: async (trackId, data) => {
    return api.post(`/tracks/${trackId}/poi`, data);
  },
  removePointOfInterest: async (trackId, poiId) => {
    return api.delete(`/tracks/${trackId}/poi/${poiId}`);
  },
};

export const photoService = {
  uploadPhoto: async (formData) => {
    return api.post('/photos', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getPhotos: async (params) => {
    return api.get('/photos', { params });
  },
  getNearbyPhotos: async (params) => {
    return api.get('/photos/nearby', { params });
  },
  getPhotoById: async (id) => {
    return api.get(`/photos/${id}`);
  },
  updatePhoto: async (id, data) => {
    return api.put(`/photos/${id}`, data);
  },
  deletePhoto: async (id) => {
    return api.delete(`/photos/${id}`);
  },
  linkPhotoToPointOfInterest: async (photoId, trackId, poiId) => {
    return api.post(`/photos/${photoId}/link/${trackId}/${poiId}`);
  },
  unlinkPhotoFromPointOfInterest: async (photoId, trackId, poiId) => {
    return api.delete(`/photos/${photoId}/link/${trackId}/${poiId}`);
  },
};

export default api; 