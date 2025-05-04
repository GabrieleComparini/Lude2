import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { photoService } from '@/services/api';
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid';

export default function PhotosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  // Fetch photos with pagination
  const { data, isLoading, isError, error } = useQuery(
    ['photos', page, limit, searchTerm],
    () => photoService.getPhotos({ page, limit, search: searchTerm }),
    {
      keepPreviousData: true,
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    // Reset to first page when searching
    setPage(1);
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Foto</h1>
          <p className="mt-2 text-sm text-gray-700">
            Galleria di tutte le foto caricate dagli utenti sulla piattaforma.
          </p>
        </div>
      </div>

      {/* Search bar */}
      <div className="mt-6 mb-6">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Cerca foto
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                name="search"
                id="search"
                className="form-input pl-10"
                placeholder="Cerca per titolo, descrizione o luogo"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary">
            Cerca
          </button>
        </form>
      </div>

      {/* Photos grid */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      ) : isError ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-red-600">
            Errore nel caricamento delle foto: {error?.message || 'Riprova più tardi'}
          </div>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data?.photos.map((photo) => (
            <Link
              key={photo._id}
              to={`/photos/${photo._id}`}
              className="group relative overflow-hidden rounded-lg shadow-md transition-transform hover:scale-[1.02]"
            >
              <div className="aspect-square w-full bg-gray-200 overflow-hidden">
                <img
                  src={photo.imageUrl}
                  alt={photo.title || 'Foto'}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                  loading="lazy"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
                <h3 className="text-sm font-medium text-white truncate">
                  {photo.title || 'Senza titolo'}
                </h3>
                <p className="mt-1 text-xs text-gray-300 truncate">
                  By {photo.creator?.username || 'Utente anonimo'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty state */}
      {data?.photos.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="text-gray-500">
            <p className="text-sm">Nessuna foto trovata</p>
          </div>
        </div>
      )}

      {/* Pagination */}
      {data && data.photos.length > 0 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn btn-outline"
            >
              Precedente
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!data.pagination?.hasNextPage}
              className="btn btn-outline"
            >
              Successiva
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(page - 1) * limit + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(page * limit, data.pagination?.totalItems)}
                </span>{' '}
                di <span className="font-medium">{data.pagination?.totalItems}</span> foto
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Precedente</span>
                  &larr;
                </button>
                {Array.from({ length: Math.min(5, data.pagination?.totalPages || 1) }).map((_, i) => {
                  const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                  if (pageNum <= data.pagination?.totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                          pageNum === page
                            ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                            : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                })}
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!data.pagination?.hasNextPage}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Successiva</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 