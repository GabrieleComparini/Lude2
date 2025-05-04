import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService, trackService, photoService } from '@/services/api';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/20/solid';
import { UsersIcon, MapIcon, PhotoIcon } from '@heroicons/react/24/outline';

// Widget statistiche
function StatsCard({ title, value, icon: Icon, change = null, loading = false }) {
  return (
    <div className="card p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-md bg-primary-100 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary-600" aria-hidden="true" />
          </div>
        </div>
        <div className="ml-5 w-full">
          <div className="flex justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
            {change !== null && (
              <div className={`inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium ${
                change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {change >= 0 ? (
                  <ArrowUpIcon className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0 self-center text-green-600" />
                ) : (
                  <ArrowDownIcon className="-ml-1 mr-0.5 h-4 w-4 flex-shrink-0 self-center text-red-600" />
                )}
                <span>
                  {Math.abs(change)}%
                </span>
              </div>
            )}
          </div>
          
          {loading ? (
            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
          ) : (
            <p className="text-3xl font-semibold text-gray-900">{value}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({
    users: 0,
    tracks: 0,
    photos: 0
  });

  // Ottieni la lista degli utenti
  const { data: usersData, isLoading: isLoadingUsers } = useQuery(
    ['users'], 
    () => userService.listUsers({ page: 1, limit: 1 })
  );

  // Ottieni le tracce
  const { data: tracksData, isLoading: isLoadingTracks } = useQuery(
    ['tracks'],
    () => trackService.getTracks({ page: 1, limit: 1 })
  );

  // Ottieni le foto
  const { data: photosData, isLoading: isLoadingPhotos } = useQuery(
    ['photos'],
    () => photoService.getPhotos({ page: 1, limit: 1 })
  );

  // Aggiorna le statistiche quando arrivano i dati
  useEffect(() => {
    if (usersData) {
      setStats(prev => ({ ...prev, users: usersData.pagination.totalItems }));
    }
    if (tracksData) {
      setStats(prev => ({ ...prev, tracks: tracksData.pagination.totalItems }));
    }
    if (photosData) {
      setStats(prev => ({ ...prev, photos: photosData.pagination.totalItems }));
    }
  }, [usersData, tracksData, photosData]);

  return (
    <div>
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        
        <div className="mt-8">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <StatsCard
              title="Utenti registrati"
              value={stats.users}
              icon={UsersIcon}
              change={10}
              loading={isLoadingUsers}
            />
            <StatsCard
              title="Tracce totali"
              value={stats.tracks}
              icon={MapIcon}
              change={5}
              loading={isLoadingTracks}
            />
            <StatsCard
              title="Foto caricate"
              value={stats.photos}
              icon={PhotoIcon}
              change={-2}
              loading={isLoadingPhotos}
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="card p-6">
            <h2 className="text-lg font-medium text-gray-900">
              Benvenuto nel pannello di amministrazione
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Questo pannello di amministrazione ti permette di gestire tutti gli aspetti della piattaforma Lude.
              Utilizza la barra laterale per navigare tra le diverse sezioni.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-base font-medium text-gray-900">Gestione utenti</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Visualizza, cerca e gestisci tutti gli utenti della piattaforma.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-base font-medium text-gray-900">Tracce e percorsi</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Visualizza e modera le tracce create dagli utenti sulla mappa.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-base font-medium text-gray-900">Gestione foto</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Visualizza e modera le foto caricate dagli utenti.
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h3 className="text-base font-medium text-gray-900">API Documentation</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Accedi alla documentazione completa delle API disponibili.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 