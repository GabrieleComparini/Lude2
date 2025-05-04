import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-6 py-12">
      <h1 className="text-9xl font-bold text-primary-600">404</h1>
      <h2 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Pagina non trovata</h2>
      <p className="mt-2 text-base text-gray-600">La pagina che stai cercando non esiste o è stata spostata.</p>
      <div className="mt-6">
        <Link
          to="/"
          className="btn btn-primary"
        >
          Torna alla dashboard
        </Link>
      </div>
    </div>
  );
} 