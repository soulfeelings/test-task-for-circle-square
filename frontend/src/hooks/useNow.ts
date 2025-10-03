import { useEffect, useState } from 'react';

export function useNow(refreshMs = 1000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, refreshMs);
    return () => window.clearInterval(interval);
  }, [refreshMs]);

  return now;
}
