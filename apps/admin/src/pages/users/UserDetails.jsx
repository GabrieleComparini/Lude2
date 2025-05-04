import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/api';
import toast from 'react-hot-toast';

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    username: '',
    email: '',
    role: '',
    isActive: true,
  });

  // Fetch user details
  const { data: user, isLoading, isError, error } = useQuery(
    ['user', id],
    () => userService.getUserByUsername(id),
    {
      onSuccess: (data) => {
        setUserData({
          name: data.name || '',
          username: data.username || '',
          email: data.email || '',
          role: data.role || 'user',
          isActive: data.isActive !== undefined ? data.isActive : true,
        });
      },
    }
  );

  // Update user mutation
  const updateUserMutation = useMutation(
    (updatedData) => userService.updateUser(id, updatedData),
    {
      onSuccess: () => {
        toast.success('Utente aggiornato con successo');
        setIsEditing(false);
        queryClient.invalidateQueries(['user', id]);
        queryClient.invalidateQueries(['users']);
      },
      onError: (err) => {
        toast.error(`Errore durante l'aggiornamento: ${err.message || 'Riprova più tardi'}`);
      },
    }
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData({
      ...userData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateUserMutation.mutate(userData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Errore nel caricamento dell'utente</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error?.message || 'Si è verificato un errore durante il caricamento dei dati.'}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="btn btn-outline"
              >
                Torna alla lista utenti
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {user?.name || user?.username || 'Dettagli utente'}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            onClick={() => navigate('/users')}
            className="btn btn-outline"
          >
            Torna alla lista
          </button>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn btn-primary"
            >
              Modifica
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                // Reset form data
                if (user) {
                  setUserData({
                    name: user.name || '',
                    username: user.username || '',
                    email: user.email || '',
                    role: user.role || 'user',
                    isActive: user.isActive !== undefined ? user.isActive : true,
                  });
                }
              }}
              className="btn btn-outline"
            >
              Annulla
            </button>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Informazioni profilo</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Dettagli e informazioni dell'utente.</p>
        </div>
        
        {!isEditing ? (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Nome completo</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.name || 'Non specificato'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Username</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Ruolo</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    user?.role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {user?.role || 'user'}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Stato</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    user?.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user?.isActive ? 'Attivo' : 'Inattivo'}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Data creazione</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('it-IT') : 'N/A'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Foto profilo</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {user?.profileImage ? (
                    <div className="mt-2">
                      <img
                        src={user.profileImage}
                        alt={user.name || user.username}
                        className="h-32 w-32 rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    'Nessuna immagine profilo'
                  )}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="name" className="form-label">
                    Nome completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="form-input"
                    value={userData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    className="form-input"
                    value={userData.username}
                    onChange={handleInputChange}
                    disabled // Username non modificabile
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    className="form-input"
                    value={userData.email}
                    onChange={handleInputChange}
                    disabled // Email non modificabile (gestita da Firebase)
                  />
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="role" className="form-label">
                    Ruolo
                  </label>
                  <select
                    id="role"
                    name="role"
                    className="form-input"
                    value={userData.role}
                    onChange={handleInputChange}
                  >
                    <option value="user">Utente</option>
                    <option value="admin">Amministratore</option>
                  </select>
                </div>

                <div className="col-span-6">
                  <div className="flex items-center">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={userData.isActive}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                      Utente attivo
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    // Reset form data
                    if (user) {
                      setUserData({
                        name: user.name || '',
                        username: user.username || '',
                        email: user.email || '',
                        role: user.role || 'user',
                        isActive: user.isActive !== undefined ? user.isActive : true,
                      });
                    }
                  }}
                  className="btn btn-outline"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updateUserMutation.isLoading}
                >
                  {updateUserMutation.isLoading ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Salvataggio...
                    </div>
                  ) : (
                    'Salva modifiche'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
} 