import React from 'react';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-8 sm:p-10 space-y-6 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
          <AlertTriangle className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-amber-600 tracking-wide">404 • Page Not Found</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">We couldn’t find that page</h1>
          <p className="text-base text-slate-600 leading-relaxed">
            The link might be broken or the page may have been moved. Use the options below to get back on track.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:border-slate-300 hover:shadow-sm transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg transition"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </button>
        </div>
        <div className="text-xs text-slate-500">
          Need help? Reach out via Support and we’ll guide you.
        </div>
      </div>
    </div>
  );
};

export default NotFound;

