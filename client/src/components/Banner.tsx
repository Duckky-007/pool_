import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Banner: React.FC = () => {
  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-xs font-medium py-2 px-4 flex items-center justify-center gap-2">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-amber-700 dark:text-amber-400" />
      <span>
        <strong>Demo prototype</strong> — not a real financial product. No real money is used. All investments and wallet balances are simulated.
      </span>
    </div>
  );
};
