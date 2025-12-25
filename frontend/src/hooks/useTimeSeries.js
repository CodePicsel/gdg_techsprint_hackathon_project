import { useEffect, useState } from 'react';
import { getTimeSeries } from '../functions/services/detectionService';

export function useTimeSeries(period = 'minutes', hoursBack = 24, refreshInterval = 60000) {
  const [timeSeries, setTimeSeries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getTimeSeries(period, hoursBack);
        setTimeSeries(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch time series:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // Initial fetch
    fetchData();

    // Set up periodic refresh
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [period, hoursBack, refreshInterval]);

  return { timeSeries, loading, error, refresh: () => fetchData() };
}