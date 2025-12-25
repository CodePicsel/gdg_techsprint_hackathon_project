import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase.config';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export function useRealtimeStats() {
  const [stats, setStats] = useState({
    totalItems: 0,
    byType: {},
    recentDetections: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to recent detections
    const q = query(
      collection(db, 'detections'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const detections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate stats from detections
      const totalItems = detections.length;
      const byType = {};

      detections.forEach(d => {
        byType[d.className] = (byType[d.className] || 0) + 1;
      });

      setStats({
        totalItems,
        byType,
        recentDetections: detections.slice(0, 10)
      });
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { stats, loading };
}