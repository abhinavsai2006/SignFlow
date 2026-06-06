import { useState } from 'react';
import { Link } from 'react-router-dom';

const Unsubscribe = () => {
  const [status, setStatus] = useState<'idle' | 'success'>('idle');

  const handleUnsubscribe = () => {
    setStatus('success');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-6">
      <div className="w-full max-w-[480px] bg-surface rounded-2xl border border-hairline-soft shadow-lg p-xxl">

        {/* Logo */}
        <div className="flex justify-center mb-xl">
          <div className="w-16 h-16 bg-brand/10 rounded-2xl flex items-center justify-center">
            <span className="text-2xl font-bold text-brand">S</span>
          </div>
        </div>

        {status === 'idle' && (
          <div className="space-y-xl">
            <div className="text-center">
              <h1 className="text-heading-md font-bold text-ink-deep mb-xs">Unsubscribe</h1>
              <p className="text-body-sm text-slate">Manage your email preferences</p>
            </div>

            {/* Warning */}
            <div className="flex gap-sm p-md rounded-xl bg-warning/10 border border-warning/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-[2px]">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <p className="text-body-sm font-semibold text-ink-deep mb-xxs">Are you sure?</p>
                <p className="text-body-xs text-slate">
                  You will no longer receive marketing emails from SignFlow. Transactional emails
                  (signature requests, password resets) will still be sent.
                </p>
              </div>
            </div>

            <button
              onClick={handleUnsubscribe}
              className="w-full py-sm px-md rounded-lg bg-critical text-white text-body-sm font-semibold hover:bg-critical/90 transition-colors"
            >
              Confirm Unsubscribe
            </button>

            <div className="text-center">
              <Link to="/" className="text-body-sm text-meta-link hover:underline">
                Cancel and return home
              </Link>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-md">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-md">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 className="text-heading-md font-bold text-ink-deep">Unsubscribed</h2>
            <p className="text-body-sm text-slate">
              Your preferences have been updated. You will no longer receive marketing emails.
            </p>
            <Link
              to="/"
              className="inline-flex justify-center w-full py-sm px-md rounded-lg bg-brand text-white text-body-sm font-semibold hover:bg-brand/90 transition-colors mt-md"
            >
              Return Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Unsubscribe;
