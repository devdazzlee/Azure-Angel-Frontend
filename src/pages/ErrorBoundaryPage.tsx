import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';
import { ShieldAlert, RefreshCcw, Home } from 'lucide-react';

const ErrorBoundaryPage: React.FC = () => {
  const error = useRouteError();

  const status = isRouteErrorResponse(error) ? error.status : 500;
  const message = isRouteErrorResponse(error)
    ? error.statusText || 'Something went wrong.'
    : (error as any)?.message || 'Unexpected application error.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full bg-white/90 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-8 sm:p-10 space-y-6 text-center">
        <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-lg">
          <ShieldAlert className="h-10 w-10 text-white" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-rose-600 tracking-wide">Application Error</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Something went wrong</h1>
          <p className="text-base text-slate-600 leading-relaxed">
            We hit an issue while loading this page. Please try again or head back home.
          </p>
          <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mt-3 inline-block text-left">
            <div className="font-semibold text-slate-700">Details</div>
            <div className="text-slate-600">Status: {status}</div>
            <div className="text-slate-600 break-words">Message: {message}</div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:border-slate-300 hover:shadow-sm transition"
          >
            <RefreshCcw className="h-4 w-4" />
            Retry
          </button>
          <button
            onClick={() => window.location.assign('/')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg transition"
          >
            <Home className="h-4 w-4" />
            Go to Home
          </button>
        </div>
        <div className="text-xs text-slate-500">
          If the issue persists, please contact support.
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundaryPage;

