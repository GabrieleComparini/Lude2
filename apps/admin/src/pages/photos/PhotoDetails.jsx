import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { photoService } from '@/services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function PhotoDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [photoData, setPhotoData] = useState({
    title: '',
    description: '',
    isPublic: true,
  });

  // Fetch photo details
  const { data: photo, isLoading, isError, error } = useQuery(
    ['photo', id],
    () => photoService.getPhotoById(id),
    {
      onSuccess: (data) => {
        setPhotoData({
          title: data.title || '',
          description: data.description || '',
          isPublic: data.isPublic !== undefined ? data.isPublic : true,
        });
      },
    }
  );

  // Update photo mutation
  const updatePhotoMutation = useMutation(
    (updatedData) => photoService.updatePhoto(id, updatedData),
    {
      onSuccess: () => {
        toast.success('Foto aggiornata con successo');
        setIsEditing(false);
        queryClient.invalidateQueries(['photo', id]);
        queryClient.invalidateQueries(['photos']);
      },
      onError: (err) => {
        toast.error(`Errore durante l'aggiornamento: ${err.message || 'Riprova più tardi'}`);
      },
    }
  );

  // Delete photo mutation
  const deletePhotoMutation = useMutation(
    () => photoService.deletePhoto(id),
    {
      onSuccess: () => {
        toast.success('Foto eliminata con successo');
        navigate('/photos');
        queryClient.invalidateQueries(['photos']);
      },
      onError: (err) => {
        toast.error(`Errore durante l'eliminazione: ${err.message || 'Riprova più tardi'}`);
      },
    }
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPhotoData({
      ...photoData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updatePhotoMutation.mutate(photoData);
  };

  const handleDelete = () => {
    if (window.confirm('Sei sicuro di voler eliminare questa foto? Questa azione non può essere annullata.')) {
      deletePhotoMutation.mutate();
    }
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
            <h3 className="text-sm font-medium text-red-800">Errore nel caricamento della foto</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error?.message || 'Si è verificato un errore durante il caricamento dei dati.'}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/photos')}
                className="btn btn-outline"
              >
                Torna alla galleria
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
            {photo?.title || 'Dettagli foto'}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            onClick={() => navigate('/photos')}
            className="btn btn-outline"
          >
            Torna alla galleria
          </button>
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="btn btn-primary"
              >
                Modifica
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="btn btn-danger"
              >
                Elimina
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                // Reset form data
                if (photo) {
                  setPhotoData({
                    title: photo.title || '',
                    description: photo.description || '',
                    isPublic: photo.isPublic !== undefined ? photo.isPublic : true,
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

      {/* Photo and details container */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Photo display */}
        <div className="card overflow-hidden">
          <div className="aspect-auto bg-gray-200">
            {photo?.imageUrl && (
              <img
                src={photo.imageUrl}
                alt={photo.title || 'Foto'}
                className="h-full w-full object-contain"
              />
            )}
          </div>
        </div>

        {/* Details section */}
        <div className="card overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Informazioni foto</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Dettagli e metadati della foto.</p>
          </div>
          
          {!isEditing ? (
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Titolo</dt>
                  <dd className="mt-1 text-sm text-gray-900">{photo?.title || 'Senza titolo'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Descrizione</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {photo?.description || 'Nessuna descrizione'}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Caricata da</dt>
                  <dd className="mt-1 text-sm text-gray-900">{photo?.creator?.username || 'Utente anonimo'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Data caricamento</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {photo?.createdAt 
                      ? new Date(photo.createdAt).toLocaleDateString('it-IT') 
                      : 'N/A'
                    }
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Stato</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      photo?.isPublic 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {photo?.isPublic ? 'Pubblica' : 'Privata'}
                    </span>
                  </dd>
                </div>
                {photo?.location && (
                  <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-500">Coordinate</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {photo.location.coordinates[1].toFixed(6)}, {photo.location.coordinates[0].toFixed(6)}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          ) : (
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-6 gap-6">
                  <div className="col-span-6">
                    <label htmlFor="title" className="form-label">
                      Titolo
                    </label>
                    <input
                      type="text"
                      name="title"
                      id="title"
                      className="form-input"
                      value={photoData.title}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="col-span-6">
                    <label htmlFor="description" className="form-label">
                      Descrizione
                    </label>
                    <textarea
                      name="description"
                      id="description"
                      rows={3}
                      className="form-input"
                      value={photoData.description}
                      onChange={handleInputChange}
                    ></textarea>
                  </div>

                  <div className="col-span-6">
                    <div className="flex items-center">
                      <input
                        id="isPublic"
                        name="isPublic"
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        checked={photoData.isPublic}
                        onChange={handleInputChange}
                      />
                      <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                        Foto pubblica
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
                      if (photo) {
                        setPhotoData({
                          title: photo.title || '',
                          description: photo.description || '',
                          isPublic: photo.isPublic !== undefined ? photo.isPublic : true,
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
                    disabled={updatePhotoMutation.isLoading}
                  >
                    {updatePhotoMutation.isLoading ? (
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

      {/* Map location section */}
      {photo?.location && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Posizione</h3>
          <div className="card overflow-hidden" style={{ height: '400px' }}>
            <MapContainer
              center={[photo.location.coordinates[1], photo.location.coordinates[0]]}
              zoom={15}
              style={{ height: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[photo.location.coordinates[1], photo.location.coordinates[0]]}>
                <Popup>
                  <div>
                    <p className="font-medium">{photo.title || 'Foto'}</p>
                    <p className="text-xs text-gray-500">
                      {photo.createdAt 
                        ? new Date(photo.createdAt).toLocaleDateString('it-IT') 
                        : 'Data sconosciuta'
                      }
                    </p>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* Track association section */}
      {photo?.track && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Traccia associata</h3>
          <div className="card p-4">
            <div className="flex items-center">
              <div className="ml-4">
                <h4 className="font-medium text-gray-900">{photo.track.title}</h4>
                <p className="text-sm text-gray-500">
                  {photo.track.pointOfInterest ? (
                    <>Associata al POI: {photo.track.pointOfInterest.title}</>
                  ) : (
                    'Non associata a un punto di interesse specifico'
                  )}
                </p>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/tracks/${photo.track._id}`)}
                    className="text-sm text-primary-600 hover:text-primary-900"
                  >
                    Visualizza traccia
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 