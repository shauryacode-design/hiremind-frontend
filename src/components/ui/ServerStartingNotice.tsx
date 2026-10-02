import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { subscribeToServerStartup } from '../../api/client';

const ServerStartingNotice: React.FC = () => {
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => subscribeToServerStartup(setIsStarting), []);

  if (!isStarting) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-3 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-950 shadow-md"
    >
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      <span>Server is starting. Please wait, and thank you for your patience.</span>
    </div>
  );
};

export default ServerStartingNotice;