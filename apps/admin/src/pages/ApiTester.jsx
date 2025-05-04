import React, { useState } from 'react';
import apiTester from '../utils/apiTester';
import { toast } from 'react-hot-toast';

export default function ApiTester() {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [customTest, setCustomTest] = useState({
    name: '',
    method: 'GET',
    endpoint: '',
    requestBody: '',
    queryParams: ''
  });
  const [userForm, setUserForm] = useState({
    email: '',
    username: '',
    name: '',
    bio: '',
    role: 'user'
  });
  const [userId, setUserId] = useState('');

  const handleRunTest = async (testFn) => {
    setIsRunning(true);
    try {
      apiTester.clear();
      testFn();
      await apiTester.runAll(setTestResults);
      toast.success('Test completed');
    } catch (error) {
      console.error('Test error:', error);
      toast.error('Test failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const runUserTests = () => {
    handleRunTest(() => {
      apiTester.testGetUsers();
    });
  };

  const runCreateUserTest = () => {
    handleRunTest(() => {
      apiTester.testCreateUser(userForm);
    });
  };

  const runGetUserTest = () => {
    if (!userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }
    handleRunTest(() => {
      apiTester.testGetUserById(userId);
    });
  };

  const runUpdateUserTest = () => {
    if (!userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }
    handleRunTest(() => {
      apiTester.testUpdateUser(userId, userForm);
    });
  };

  const runDeleteUserTest = () => {
    if (!userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }
    handleRunTest(() => {
      apiTester.testDeleteUser(userId);
    });
  };

  const runCustomTest = () => {
    if (!customTest.endpoint.trim()) {
      toast.error('Please enter an endpoint');
      return;
    }

    let requestData = null;
    if (customTest.requestBody.trim()) {
      try {
        requestData = JSON.parse(customTest.requestBody);
      } catch (e) {
        toast.error('Invalid JSON in request body');
        return;
      }
    }

    let queryParams = null;
    if (customTest.queryParams.trim()) {
      try {
        queryParams = JSON.parse(customTest.queryParams);
      } catch (e) {
        toast.error('Invalid JSON in query parameters');
        return;
      }
    }

    handleRunTest(() => {
      apiTester.testCustomApi(
        customTest.name || `${customTest.method} ${customTest.endpoint}`,
        customTest.method,
        customTest.endpoint,
        requestData,
        queryParams
      );
    });
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API Tester</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User API Tests */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">User API Tests</h2>
          
          <div className="mb-4">
            <button
              onClick={runUserTests}
              disabled={isRunning}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
            >
              Test Get Users
            </button>
          </div>

          <div className="border-t pt-4 mb-4">
            <h3 className="font-medium mb-2">User ID Operations</h3>
            <div className="flex mb-4">
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID"
                className="flex-1 border p-2 rounded mr-2"
              />
              <button
                onClick={runGetUserTest}
                disabled={isRunning}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                Get
              </button>
              <button
                onClick={runUpdateUserTest}
                disabled={isRunning}
                className="ml-2 bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 disabled:bg-gray-400"
              >
                Update
              </button>
              <button
                onClick={runDeleteUserTest}
                disabled={isRunning}
                className="ml-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
              >
                Delete
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Create/Update User Form</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                  className="mt-1 block w-full border p-2 rounded"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                  className="mt-1 block w-full border p-2 rounded"
                  placeholder="username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                  className="mt-1 block w-full border p-2 rounded"
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Bio</label>
                <textarea
                  value={userForm.bio}
                  onChange={(e) => setUserForm({...userForm, bio: e.target.value})}
                  className="mt-1 block w-full border p-2 rounded"
                  placeholder="User bio"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                  className="mt-1 block w-full border p-2 rounded"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <button
                  onClick={runCreateUserTest}
                  disabled={isRunning}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom API Test */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Custom API Test</h2>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Test Name</label>
              <input
                type="text"
                value={customTest.name}
                onChange={(e) => setCustomTest({...customTest, name: e.target.value})}
                className="mt-1 block w-full border p-2 rounded"
                placeholder="Custom Test"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Method</label>
              <select
                value={customTest.method}
                onChange={(e) => setCustomTest({...customTest, method: e.target.value})}
                className="mt-1 block w-full border p-2 rounded"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Endpoint</label>
              <input
                type="text"
                value={customTest.endpoint}
                onChange={(e) => setCustomTest({...customTest, endpoint: e.target.value})}
                className="mt-1 block w-full border p-2 rounded"
                placeholder="/api/endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Request Body (JSON)</label>
              <textarea
                value={customTest.requestBody}
                onChange={(e) => setCustomTest({...customTest, requestBody: e.target.value})}
                className="mt-1 block w-full border p-2 rounded font-mono text-sm"
                placeholder='{"key": "value"}'
                rows="4"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Query Parameters (JSON)</label>
              <textarea
                value={customTest.queryParams}
                onChange={(e) => setCustomTest({...customTest, queryParams: e.target.value})}
                className="mt-1 block w-full border p-2 rounded font-mono text-sm"
                placeholder='{"page": 1, "limit": 10}'
                rows="2"
              />
            </div>
            <div>
              <button
                onClick={runCustomTest}
                disabled={isRunning}
                className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400"
              >
                Run Custom Test
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Test Results</h2>
        {testResults.length > 0 ? (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Results
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testResults.map((test, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {test.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${test.status === 'success' ? 'bg-green-100 text-green-800' : 
                          test.status === 'error' ? 'bg-red-100 text-red-800' : 
                          test.status === 'running' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'}`}>
                        {test.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {test.endTime && test.startTime ? 
                        `${(test.endTime - test.startTime) / 1000}s` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-h-40 overflow-auto">
                        {test.error ? (
                          <pre className="text-red-500 text-xs">{JSON.stringify(test.error, null, 2)}</pre>
                        ) : test.result ? (
                          <pre className="text-xs">{JSON.stringify(test.result, null, 2)}</pre>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
            No test results yet. Run a test to see results here.
          </div>
        )}
      </div>
    </div>
  );
} 