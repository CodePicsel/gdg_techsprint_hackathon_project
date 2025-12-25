import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase.config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function useDetectionLog(maxItems = 100) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, 'detectionLog'),
      orderBy('order', 'desc'),
      limit(maxItems)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate().toISOString() || null
        }));
        setLogs(logData);
        setLoading(false);
      },
      (err) => {
        console.error('Detection log listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [maxItems]);

  return { logs, loading, error };
}