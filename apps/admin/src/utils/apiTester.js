import api from '../services/api';
import { toast } from 'react-hot-toast';

/**
 * API Tester utility to help test API endpoints
 */
class ApiTester {
  constructor() {
    this.results = [];
    this.isRunning = false;
  }

  /**
   * Add a test to the queue
   * @param {string} name - Test name
   * @param {Function} testFn - Async function that performs the test
   */
  addTest(name, testFn) {
    this.results.push({
      name,
      status: 'pending',
      testFn,
      result: null,
      error: null,
      startTime: null,
      endTime: null
    });
    return this;
  }

  /**
   * Run all tests in the queue
   * @param {Function} onUpdate - Callback function called on each test update
   * @returns {Promise<Array>} - Test results
   */
  async runAll(onUpdate = () => {}) {
    if (this.isRunning) return;
    this.isRunning = true;

    for (let i = 0; i < this.results.length; i++) {
      const test = this.results[i];
      test.status = 'running';
      test.startTime = new Date();
      onUpdate([...this.results]);

      try {
        test.result = await test.testFn();
        test.status = 'success';
      } catch (error) {
        test.error = error;
        test.status = 'error';
        console.error(`Test failed: ${test.name}`, error);
      }

      test.endTime = new Date();
      onUpdate([...this.results]);
    }

    this.isRunning = false;
    return this.results;
  }

  /**
   * Clear all test results
   */
  clear() {
    this.results = [];
    return this;
  }

  /**
   * Get all test results
   */
  getResults() {
    return this.results;
  }

  /**
   * Predefined test: Create a user
   */
  testCreateUser(userData) {
    return this.addTest(
      'Create User',
      async () => {
        const response = await api.post('/users', userData);
        return response;
      }
    );
  }

  /**
   * Predefined test: Get users list
   */
  testGetUsers(params = {}) {
    return this.addTest(
      'Get Users List',
      async () => {
        const response = await api.get('/users', { params });
        return response;
      }
    );
  }

  /**
   * Predefined test: Get user by ID
   */
  testGetUserById(userId) {
    return this.addTest(
      `Get User (${userId})`,
      async () => {
        const response = await api.get(`/users/${userId}`);
        return response;
      }
    );
  }

  /**
   * Predefined test: Update user
   */
  testUpdateUser(userId, userData) {
    return this.addTest(
      `Update User (${userId})`,
      async () => {
        const response = await api.put(`/users/${userId}`, userData);
        return response;
      }
    );
  }

  /**
   * Predefined test: Delete user
   */
  testDeleteUser(userId) {
    return this.addTest(
      `Delete User (${userId})`,
      async () => {
        const response = await api.delete(`/users/${userId}`);
        return response;
      }
    );
  }

  /**
   * Custom API test
   */
  testCustomApi(name, method, endpoint, data = null, params = null) {
    return this.addTest(
      name,
      async () => {
        const config = {};
        if (params) config.params = params;
        
        switch (method.toLowerCase()) {
          case 'get':
            return await api.get(endpoint, config);
          case 'post':
            return await api.post(endpoint, data, config);
          case 'put':
            return await api.put(endpoint, data, config);
          case 'delete':
            return await api.delete(endpoint, config);
          default:
            throw new Error(`Unsupported method: ${method}`);
        }
      }
    );
  }
}

// Export singleton instance
export default new ApiTester(); 