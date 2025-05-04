import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trackService } from '@/services/api';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
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

export default function TrackDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [trackData, setTrackData] = useState({
    title: '',
    description: '',
    isPublic: true,
  });

  // Fetch track details
  const { data: track, isLoading, isError, error } = useQuery(
    ['track', id],
    () => trackService.getTrackById(id),
    {
      onSuccess: (data) => {
        setTrackData({
          title: data.title || '',
          description: data.description || '',
          isPublic: data.isPublic !== undefined ? data.isPublic : true,
        });
      },
    }
  );

  // Update track mutation
  const updateTrackMutation = useMutation(
    (updatedData) => trackService.updateTrack(id, updatedData),
    {
      onSuccess: () => {
        toast.success('Traccia aggiornata con successo');
        setIsEditing(false);
        queryClient.invalidateQueries(['track', id]);
        queryClient.invalidateQueries(['tracks']);
      },
      onError: (err) => {
        toast.error(`Errore durante l'aggiornamento: ${err.message || 'Riprova più tardi'}`);
      },
    }
  );

  // Delete track mutation
  const deleteTrackMutation = useMutation(
    () => trackService.deleteTrack(id),
    {
      onSuccess: () => {
        toast.success('Traccia eliminata con successo');
        navigate('/tracks');
        queryClient.invalidateQueries(['tracks']);
      },
      onError: (err) => {
        toast.error(`Errore durante l'eliminazione: ${err.message || 'Riprova più tardi'}`);
      },
    }
  );

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTrackData({
      ...trackData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateTrackMutation.mutate(trackData);
  };

  const handleDelete = () => {
    if (window.confirm('Sei sicuro di voler eliminare questa traccia? Questa azione non può essere annullata.')) {
      deleteTrackMutation.mutate();
    }
  };

  // Calculate map bounds from track coordinates
  const getBounds = () => {
    if (!track || !track.coordinates || !track.coordinates.length) return null;
    
    const points = track.coordinates.map(coord => [coord.latitude, coord.longitude]);
    return L.latLngBounds(points);
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
            <h3 className="text-sm font-medium text-red-800">Errore nel caricamento della traccia</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error?.message || 'Si è verificato un errore durante il caricamento dei dati.'}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/tracks')}
                className="btn btn-outline"
              >
                Torna alla lista tracce
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
            {track?.title || 'Dettagli traccia'}
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
          <button
            type="button"
            onClick={() => navigate('/tracks')}
            className="btn btn-outline"
          >
            Torna alla lista
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
                if (track) {
                  setTrackData({
                    title: track.title || '',
                    description: track.description || '',
                    isPublic: track.isPublic !== undefined ? track.isPublic : true,
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

      {/* Map display */}
      {track && track.coordinates && track.coordinates.length > 0 && (
        <div className="mb-6">
          <div className="card overflow-hidden" style={{ height: '400px' }}>
            <MapContainer
              bounds={getBounds()}
              style={{ height: '100%' }}
              zoom={13}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Polyline
                positions={track.coordinates.map(coord => [coord.latitude, coord.longitude])}
                color="#4F46E5"
              />
              
              {/* Start point marker */}
              {track.coordinates.length > 0 && (
                <Marker position={[track.coordinates[0].latitude, track.coordinates[0].longitude]}>
                  <Popup>Punto di partenza</Popup>
                </Marker>
              )}
              
              {/* End point marker */}
              {track.coordinates.length > 1 && (
                <Marker position={[
                  track.coordinates[track.coordinates.length - 1].latitude,
                  track.coordinates[track.coordinates.length - 1].longitude
                ]}>
                  <Popup>Punto di arrivo</Popup>
                </Marker>
              )}
              
              {/* Points of interest markers */}
              {track.pointsOfInterest && track.pointsOfInterest.map(poi => (
                <Marker
                  key={poi._id}
                  position={[poi.location.coordinates[1], poi.location.coordinates[0]]}
                >
                  <Popup>
                    <div>
                      <h3 className="font-medium">{poi.title}</h3>
                      <p className="text-sm text-gray-600">{poi.description || 'Nessuna descrizione'}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Informazioni traccia</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Dettagli e informazioni della traccia.</p>
        </div>
        
        {!isEditing ? (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Titolo</dt>
                <dd className="mt-1 text-sm text-gray-900">{track?.title}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Creata da</dt>
                <dd className="mt-1 text-sm text-gray-900">{track?.creator?.username || 'Utente anonimo'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Lunghezza</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {track?.length ? `${(track.length / 1000).toFixed(2)} km` : 'N/A'}
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Punti di interesse</dt>
                <dd className="mt-1 text-sm text-gray-900">{track?.pointsOfInterest?.length || 0}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Stato</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    track?.isPublic 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {track?.isPublic ? 'Pubblica' : 'Privata'}
                  </span>
                </dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Data creazione</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {track?.createdAt ? new Date(track.createdAt).toLocaleDateString('it-IT') : 'N/A'}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Descrizione</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {track?.description || 'Nessuna descrizione'}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="title" className="form-label">
                    Titolo
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    className="form-input"
                    value={trackData.title}
                    onChange={handleInputChange}
                    required
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
                    value={trackData.description}
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
                      checked={trackData.isPublic}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                      Traccia pubblica
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
                    if (track) {
                      setTrackData({
                        title: track.title || '',
                        description: track.description || '',
                        isPublic: track.isPublic !== undefined ? track.isPublic : true,
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
                  disabled={updateTrackMutation.isLoading}
                >
                  {updateTrackMutation.isLoading ? (
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

      {/* Points of interest section */}
      {track?.pointsOfInterest && track.pointsOfInterest.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Punti di interesse</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {track.pointsOfInterest.map(poi => (
              <div key={poi._id} className="card p-4">
                <h4 className="font-medium text-gray-900">{poi.title}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {poi.description || 'Nessuna descrizione'}
                </p>
                {poi.photos && poi.photos.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Foto collegate: {poi.photos.length}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 