import React, { useState } from 'react';
import apiTester from '../utils/apiTester';
import { toast } from 'react-hot-toast';
import { Tab } from '@headlessui/react';
import api from '../services/api';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function ApiTester() {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState(null);
  const [params, setParams] = useState({});

  // Handle running a test
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

  // Run a test for the selected endpoint
  const runEndpointTest = () => {
    if (!activeEndpoint) return;
    
    // Validate required parameters
    const requiredParams = activeEndpoint.requiredParams || [];
    const missingParams = requiredParams.filter(param => !params[param] && params[param] !== false);
    
    if (missingParams.length > 0) {
      toast.error(`Missing required parameters: ${missingParams.join(', ')}`);
      return;
    }

    const createTestConfig = () => {
      const endpointWithParams = activeEndpoint.url.replace(/:([a-zA-Z0-9_]+)/g, (match, param) => {
        return params[param] || match;
      });

      // For endpoints that use form data
      if (activeEndpoint.formData) {
        // FormData will be handled in the test function
        const formData = new FormData();
        activeEndpoint.formData.forEach(field => {
          if (params[field] && params[field] instanceof File) {
            formData.append(field, params[field]);
          } else if (params[field]) {
            formData.append(field, params[field]);
          }
        });
        
        return apiTester.testCustomApi(
          activeEndpoint.description,
          activeEndpoint.method,
          endpointWithParams,
          formData,
          activeEndpoint.method === 'GET' ? getQueryParams() : null
        );
      } else {
        // Regular JSON data
        const bodyParams = activeEndpoint.method !== 'GET' ? getBodyParams() : null;
        const queryParams = activeEndpoint.method === 'GET' ? getQueryParams() : null;
        
        return apiTester.testCustomApi(
          activeEndpoint.description,
          activeEndpoint.method,
          endpointWithParams,
          bodyParams,
          queryParams
        );
      }
    };

    handleRunTest(createTestConfig);
  };

  // Get body parameters for non-GET requests
  const getBodyParams = () => {
    const bodyParams = {};
    activeEndpoint.bodyParams?.forEach(param => {
      if (params[param] !== undefined) {
        bodyParams[param] = params[param];
      }
    });
    return bodyParams;
  };

  // Get query parameters for GET requests
  const getQueryParams = () => {
    const queryParams = {};
    activeEndpoint.queryParams?.forEach(param => {
      if (params[param] !== undefined) {
        queryParams[param] = params[param];
      }
    });
    return queryParams;
  };

  // Handle parameter changes
  const handleParamChange = (param, value) => {
    setParams(prev => ({
      ...prev,
      [param]: value
    }));
  };

  // Handle file upload
  const handleFileChange = (e, param) => {
    if (e.target.files && e.target.files[0]) {
      setParams(prev => ({
        ...prev,
        [param]: e.target.files[0]
      }));
    }
  };

  // Select an endpoint and reset params
  const selectEndpoint = (endpoint) => {
    setActiveEndpoint(endpoint);
    setParams({});
  };

  // API Categories and Endpoints configuration
  const categories = {
    auth: {
      name: 'Authentication',
      endpoints: [
        {
          name: 'Sync User',
          description: 'Sincronizza utente Firebase',
          url: '/auth/sync',
          method: 'POST',
          bodyParams: ['token'],
          requiredParams: ['token']
        },
        {
          name: 'Verify Token',
          description: 'Verifica token',
          url: '/auth/verify',
          method: 'GET'
        },
        {
          name: 'Create Admin',
          description: 'Crea utente admin (solo admin)',
          url: '/auth/create-admin',
          method: 'POST',
          bodyParams: ['email', 'password', 'name'],
          requiredParams: ['email', 'password', 'name']
        }
      ]
    },
    users: {
      name: 'Utenti',
      endpoints: [
        {
          name: 'Current User',
          description: 'Ottiene profilo utente corrente',
          url: '/users/me',
          method: 'GET'
        },
        {
          name: 'Update Profile',
          description: 'Aggiorna profilo',
          url: '/users/me',
          method: 'PUT',
          bodyParams: ['name', 'username', 'bio', 'preferences', 'location']
        },
        {
          name: 'Update Profile Image',
          description: 'Aggiorna immagine profilo',
          url: '/users/me/profile-image',
          method: 'PUT',
          formData: ['profileImage'],
          requiredParams: ['profileImage']
        },
        {
          name: 'Get User by Username',
          description: 'Ottiene utente per username',
          url: '/users/:username',
          method: 'GET',
          requiredParams: ['username']
        },
        {
          name: 'List Users',
          description: 'Lista utenti (admin)',
          url: '/users',
          method: 'GET',
          queryParams: ['page', 'limit', 'search', 'sort', 'order']
        },
        {
          name: 'Follow User',
          description: 'Segui utente',
          url: '/users/:id/follow',
          method: 'POST',
          requiredParams: ['id']
        },
        {
          name: 'Unfollow User',
          description: 'Smetti di seguire',
          url: '/users/:id/unfollow',
          method: 'POST',
          requiredParams: ['id']
        },
        {
          name: 'Get Connections',
          description: 'Ottieni follower/following',
          url: '/users/:id/connections',
          method: 'GET',
          requiredParams: ['id'],
          queryParams: ['type']
        }
      ]
    },
    tracks: {
      name: 'Tracce',
      endpoints: [
        {
          name: 'Create Track',
          description: 'Crea traccia',
          url: '/tracks',
          method: 'POST',
          bodyParams: ['title', 'description', 'coordinates', 'isPublic', 'tags'],
          requiredParams: ['title', 'coordinates']
        },
        {
          name: 'List Tracks',
          description: 'Lista tracce',
          url: '/tracks',
          method: 'GET',
          queryParams: ['page', 'limit', 'type', 'sort', 'search', 'tags']
        },
        {
          name: 'Nearby Tracks',
          description: 'Tracce vicine',
          url: '/tracks/nearby',
          method: 'GET',
          queryParams: ['lat', 'lng', 'maxDistance'],
          requiredParams: ['lat', 'lng']
        },
        {
          name: 'Track Details',
          description: 'Dettagli traccia',
          url: '/tracks/:id',
          method: 'GET',
          requiredParams: ['id']
        },
        {
          name: 'Update Track',
          description: 'Aggiorna traccia',
          url: '/tracks/:id',
          method: 'PUT',
          requiredParams: ['id'],
          bodyParams: ['title', 'description', 'isPublic', 'tags']
        },
        {
          name: 'Delete Track',
          description: 'Elimina traccia',
          url: '/tracks/:id',
          method: 'DELETE',
          requiredParams: ['id']
        },
        {
          name: 'Add POI',
          description: 'Aggiungi punto interesse',
          url: '/tracks/:id/poi',
          method: 'POST',
          requiredParams: ['id', 'title', 'lat', 'lng'],
          bodyParams: ['title', 'description', 'lat', 'lng', 'type']
        },
        {
          name: 'Remove POI',
          description: 'Rimuovi punto interesse',
          url: '/tracks/:trackId/poi/:poiId',
          method: 'DELETE',
          requiredParams: ['trackId', 'poiId']
        }
      ]
    },
    photos: {
      name: 'Foto',
      endpoints: [
        {
          name: 'Upload Photo',
          description: 'Carica foto',
          url: '/photos',
          method: 'POST',
          formData: ['image', 'title', 'description', 'lat', 'lng', 'tags', 'trackId', 'poiId'],
          requiredParams: ['image']
        },
        {
          name: 'List Photos',
          description: 'Lista foto',
          url: '/photos',
          method: 'GET',
          queryParams: ['page', 'limit', 'type', 'sort', 'search', 'tags']
        },
        {
          name: 'Nearby Photos',
          description: 'Foto vicine',
          url: '/photos/nearby',
          method: 'GET',
          queryParams: ['lat', 'lng', 'maxDistance'],
          requiredParams: ['lat', 'lng']
        },
        {
          name: 'Photo Details',
          description: 'Dettagli foto',
          url: '/photos/:id',
          method: 'GET',
          requiredParams: ['id']
        },
        {
          name: 'Update Photo',
          description: 'Aggiorna foto',
          url: '/photos/:id',
          method: 'PUT',
          requiredParams: ['id'],
          bodyParams: ['title', 'description', 'isPublic', 'tags']
        },
        {
          name: 'Delete Photo',
          description: 'Elimina foto',
          url: '/photos/:id',
          method: 'DELETE',
          requiredParams: ['id']
        },
        {
          name: 'Link Photo to POI',
          description: 'Collega foto a POI',
          url: '/photos/:photoId/link/:trackId/:poiId',
          method: 'POST',
          requiredParams: ['photoId', 'trackId', 'poiId']
        },
        {
          name: 'Unlink Photo from POI',
          description: 'Scollega foto da POI',
          url: '/photos/:photoId/link/:trackId/:poiId',
          method: 'DELETE',
          requiredParams: ['photoId', 'trackId', 'poiId']
        }
      ]
    }
  };

  // Render a parameter input based on its type
  const renderParamInput = (param) => {
    // Handle file parameters
    if (activeEndpoint.formData && activeEndpoint.formData.includes(param) && param.includes('image')) {
      return (
        <div className="mt-1">
          <input
            type="file"
            id={param}
            accept="image/*"
            onChange={(e) => handleFileChange(e, param)}
            className="sr-only"
          />
          <label
            htmlFor={param}
            className="cursor-pointer inline-flex items-center rounded border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none"
          >
            {params[param] ? params[param].name : 'Select file'}
          </label>
        </div>
      );
    }

    // Type-specific inputs
    switch (param) {
      case 'isPublic':
        return (
          <select
            value={params[param] || ''}
            onChange={(e) => handleParamChange(param, e.target.value === 'true')}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select...</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        );
      case 'type':
        return (
          <select
            value={params[param] || ''}
            onChange={(e) => handleParamChange(param, e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            <option value="">Select...</option>
            <option value="viewpoint">Viewpoint</option>
            <option value="rest">Rest</option>
            <option value="danger">Danger</option>
            <option value="historical">Historical</option>
            <option value="natural">Natural</option>
            <option value="other">Other</option>
          </select>
        );
      case 'lat':
      case 'lng':
      case 'maxDistance':
      case 'page':
      case 'limit':
        return (
          <input
            type="number"
            value={params[param] || ''}
            onChange={(e) => handleParamChange(param, e.target.value ? Number(e.target.value) : '')}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={`Enter ${param}`}
          />
        );
      case 'tags':
        return (
          <input
            type="text"
            value={params[param] || ''}
            onChange={(e) => handleParamChange(param, e.target.value ? e.target.value.split(',') : [])}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Tag1,Tag2,Tag3"
          />
        );
      case 'coordinates':
        return (
          <textarea
            value={params[param] ? JSON.stringify(params[param]) : ''}
            onChange={(e) => {
              try {
                const value = e.target.value ? JSON.parse(e.target.value) : '';
                handleParamChange(param, value);
              } catch (error) {
                // Allow invalid JSON during typing
                handleParamChange(param, e.target.value);
              }
            }}
            rows={4}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder='[{"lat": 12.34, "lng": 56.78}, {"lat": 23.45, "lng": 67.89}]'
          />
        );
      default:
        return (
          <input
            type="text"
            value={params[param] || ''}
            onChange={(e) => handleParamChange(param, e.target.value)}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder={`Enter ${param}`}
          />
        );
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">API Tester</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left panel - API Endpoints */}
        <div className="w-full md:w-2/5">
          <Tab.Group>
            <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1">
              {Object.keys(categories).map((category) => (
                <Tab
                  key={category}
                  className={({ selected }) =>
                    classNames(
                      'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                      'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                      selected
                        ? 'bg-white shadow text-blue-700'
                        : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                    )
                  }
                >
                  {categories[category].name}
                </Tab>
              ))}
            </Tab.List>
            <Tab.Panels className="mt-2">
              {Object.keys(categories).map((category) => (
                <Tab.Panel
                  key={category}
                  className="rounded-xl bg-white p-3 shadow-md ring-1 ring-black/5"
                >
                  <ul className="space-y-1">
                    {categories[category].endpoints.map((endpoint) => (
                      <li key={endpoint.url + endpoint.method}>
                        <button
                          className={`w-full text-left px-4 py-2 rounded ${
                            activeEndpoint === endpoint
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={() => selectEndpoint(endpoint)}
                        >
                          <div className="flex justify-between">
                            <span className="font-medium">{endpoint.name}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                              endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                              endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {endpoint.method}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{endpoint.url}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>
        </div>
        
        {/* Right panel - Parameters & Results */}
        <div className="w-full md:w-3/5">
          {activeEndpoint ? (
            <div className="bg-white shadow-md rounded-lg p-4">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">{activeEndpoint.name}</h2>
                <div className="flex items-center mt-1">
                  <span className={`mr-2 text-xs font-bold px-2 py-1 rounded ${
                    activeEndpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                    activeEndpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                    activeEndpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {activeEndpoint.method}
                  </span>
                  <code className="text-sm">{activeEndpoint.url}</code>
                </div>
                <p className="text-sm text-gray-500 mt-1">{activeEndpoint.description}</p>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium mb-2">Parameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* URL Parameters */}
                  {activeEndpoint.url.includes(':') && (
                    activeEndpoint.url.match(/:([a-zA-Z0-9_]+)/g)?.map(param => {
                      const paramName = param.substring(1);
                      return (
                        <div key={paramName}>
                          <label className="block text-sm font-medium text-gray-700">
                            {paramName} {activeEndpoint.requiredParams?.includes(paramName) && (
                              <span className="text-red-500">*</span>
                            )}
                          </label>
                          {renderParamInput(paramName)}
                        </div>
                      );
                    })
                  )}
                  
                  {/* Query Parameters for GET */}
                  {activeEndpoint.method === 'GET' && activeEndpoint.queryParams?.map(param => (
                    <div key={param}>
                      <label className="block text-sm font-medium text-gray-700">
                        {param} {activeEndpoint.requiredParams?.includes(param) && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>
                      {renderParamInput(param)}
                    </div>
                  ))}
                  
                  {/* Body Parameters for non-GET */}
                  {activeEndpoint.method !== 'GET' && (
                    activeEndpoint.formData ? 
                    // Form Data parameters
                    activeEndpoint.formData.map(param => (
                      <div key={param}>
                        <label className="block text-sm font-medium text-gray-700">
                          {param} {activeEndpoint.requiredParams?.includes(param) && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        {renderParamInput(param)}
                      </div>
                    )) : 
                    // JSON Body parameters
                    activeEndpoint.bodyParams?.map(param => (
                      <div key={param}>
                        <label className="block text-sm font-medium text-gray-700">
                          {param} {activeEndpoint.requiredParams?.includes(param) && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        {renderParamInput(param)}
                      </div>
                    ))
                  )}
                </div>
              </div>
              
              <div>
                <button
                  onClick={runEndpointTest}
                  disabled={isRunning}
                  className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300"
                >
                  {isRunning ? 'Running...' : 'Test Endpoint'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow-md rounded-lg p-6 text-center">
              <p className="text-gray-500">Select an API endpoint from the left panel to test</p>
            </div>
          )}
          
          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mt-6 bg-white shadow-md rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-4">Test Results</h3>
              {testResults.map((test, index) => (
                <div 
                  key={index} 
                  className={`mb-4 p-4 rounded-md ${
                    test.status === 'success' ? 'bg-green-50' : 
                    test.status === 'error' ? 'bg-red-50' : 'bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between">
                    <h4 className="font-medium">{test.name}</h4>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      test.status === 'success' ? 'bg-green-100 text-green-800' : 
                      test.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  
                  {test.endTime && test.startTime && (
                    <p className="text-xs text-gray-500 mt-1">
                      Duration: {(test.endTime - test.startTime) / 1000}s
                    </p>
                  )}
                  
                  {test.status === 'success' && test.result && (
                    <div className="mt-2">
                      <details>
                        <summary className="cursor-pointer text-sm font-medium text-indigo-600">
                          View Response
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                          {JSON.stringify(test.result, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                  
                  {test.status === 'error' && test.error && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600">{test.error.message || 'Unknown error'}</p>
                      <details>
                        <summary className="cursor-pointer text-sm font-medium text-red-600">
                          View Error Details
                        </summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-48">
                          {JSON.stringify(test.error, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 