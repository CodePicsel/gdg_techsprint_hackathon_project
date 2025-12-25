import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase.config';
import { doc, onSnapshot } from 'firebase/firestore';

export function useDetectionStats() {
  const [stats, setStats] = useState({
    totalItems: 0,
    itemsPerMinute: 0,
    itemsPerHour: 0,
    avgConfidence: 0,
    byType: {},
    lastUpdated: null,
    detectionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Real-time listener for current stats
    const unsubscribe = onSnapshot(
      doc(db, 'stats', 'current', 'metrics', 'live'),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setStats({
            ...data,
            lastUpdated: data.lastUpdated?.toDate().toISOString() || null
          });
        }
        setLoading(false);
      },
      (err) => {
        console.error('Stats listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { stats, loading, error };
}