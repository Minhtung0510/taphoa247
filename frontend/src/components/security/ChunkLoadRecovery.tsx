'use client';

import { useEffect } from 'react';

function isChunkLoadError(value: unknown): boolean {
  const message = value instanceof Error ? `${value.name} ${value.message}` : String(value ?? '');
  return /ChunkLoadError|Loading chunk|Failed to load chunk|Failed to fetch dynamically imported module|dynamically imported module/i.test(message);
}

export function ChunkLoadRecovery() {
  useEffect(() => {
    let recoveryTimer: number | undefined;
    const recoveryKey = `dtff_chunk_recovery:${window.location.pathname}`;

    const recoverOnce = (error: unknown) => {
      if (!isChunkLoadError(error)) return;

      try {
        if (sessionStorage.getItem(recoveryKey)) return;
        sessionStorage.setItem(recoveryKey, String(Date.now()));
      } catch {
        // If storage is unavailable, still perform one navigation recovery.
      }

      window.location.reload();
    };

    const handleError = (event: ErrorEvent) => recoverOnce(event.error || event.message);
    const handleRejection = (event: PromiseRejectionEvent) => recoverOnce(event.reason);

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    // A successful load clears the guard so a later deployment can recover too.
    recoveryTimer = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(recoveryKey);
      } catch {}
    }, 15000);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      if (recoveryTimer) window.clearTimeout(recoveryTimer);
    };
  }, []);

  return null;
}
