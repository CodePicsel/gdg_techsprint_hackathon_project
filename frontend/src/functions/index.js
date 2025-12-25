const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// ==========================================
// INGESTION ENDPOINT
// ==========================================

exports.ingestDetection = functions.https.onRequest(async (req, res) => {
  // CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).send('');
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { detections } = req.body;

    if (!detections || !Array.isArray(detections)) {
      return res.status(400).json({ 
        error: 'Invalid format. Expected: { detections: [...] }' 
      });
    }

    // Process all detections in batch
    const batch = db.batch();
    const timestamp = admin.firestore.Timestamp.now();
    const detectionIds = [];

    for (const detection of detections) {
      const { x, y, w, h, score, class_id, class_name } = detection;

      if (!class_name || score === undefined) {
        continue;
      }

      const detectionRef = db.collection('detections').doc();
      batch.set(detectionRef, {
        timestamp,
        className: class_name,
        confidence: score,
        classId: class_id || 0,
        bbox: { x, y, w, h }
      });

      detectionIds.push(detectionRef.id);
    }

    await batch.commit();

    res.status(200).json({
      success: true,
      message: `${detections.length} detections ingested`,
      detectionIds,
      timestamp: timestamp.toDate().toISOString()
    });

  } catch (error) {
    console.error('Ingestion error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// ==========================================
// AGGREGATION TRIGGER
// ==========================================

exports.onDetectionCreated = functions.firestore
  .document('detections/{detectionId}')
  .onCreate(async (snap, context) => {
    const detection = snap.data();
    const timestamp = detection.timestamp.toDate();

    try {
      await Promise.all([
        updateCurrentStats(detection),
        updateMinuteStats(detection, timestamp),
        updateHourStats(detection, timestamp),
        updateDetectionLog(detection, snap.id, timestamp)
      ]);

      console.log('Aggregation completed for:', snap.id);
    } catch (error) {
      console.error('Aggregation error:', error);
    }
  });

// ==========================================
// HELPER FUNCTIONS
// ==========================================

async function updateCurrentStats(detection) {
  const statsRef = db.collection('stats').doc('current').collection('metrics').doc('live');

  return db.runTransaction(async (transaction) => {
    const statsDoc = await transaction.get(statsRef);
    
    let currentStats = statsDoc.exists ? statsDoc.data() : {
      totalItems: 0,
      byType: {},
      confidenceSum: 0,
      confidenceCount: 0,
      avgConfidence: 0,
      itemsPerMinute: 0,
      itemsPerHour: 0,
      lastMinuteTimestamp: null,
      lastHourTimestamp: null,
      minuteCount: 0,
      hourCount: 0
    };

    const now = admin.firestore.Timestamp.now();
    const currentTime = now.toDate();

    currentStats.totalItems += 1;
    currentStats.byType[detection.className] = (currentStats.byType[detection.className] || 0) + 1;
    currentStats.confidenceSum += detection.confidence;
    currentStats.confidenceCount += 1;
    currentStats.avgConfidence = currentStats.confidenceSum / currentStats.confidenceCount;

    if (!currentStats.lastMinuteTimestamp) {
      currentStats.lastMinuteTimestamp = now;
      currentStats.minuteCount = 1;
    } else {
      const minutesDiff = (currentTime - currentStats.lastMinuteTimestamp.toDate()) / 60000;
      if (minutesDiff >= 1) {
        currentStats.itemsPerMinute = currentStats.minuteCount / minutesDiff;
        currentStats.lastMinuteTimestamp = now;
        currentStats.minuteCount = 1;
      } else {
        currentStats.minuteCount += 1;
        currentStats.itemsPerMinute = currentStats.minuteCount / (minutesDiff || 0.1);
      }
    }

    if (!currentStats.lastHourTimestamp) {
      currentStats.lastHourTimestamp = now;
      currentStats.hourCount = 1;
    } else {
      const hoursDiff = (currentTime - currentStats.lastHourTimestamp.toDate()) / 3600000;
      if (hoursDiff >= 1) {
        currentStats.itemsPerHour = currentStats.hourCount / hoursDiff;
        currentStats.lastHourTimestamp = now;
        currentStats.hourCount = 1;
      } else {
        currentStats.hourCount += 1;
        currentStats.itemsPerHour = currentStats.hourCount / (hoursDiff || 0.01);
      }
    }

    currentStats.lastUpdated = now;
    currentStats.detectionRate = currentStats.itemsPerMinute;

    transaction.set(statsRef, currentStats);
  });
}

async function updateMinuteStats(detection, timestamp) {
  const minuteKey = formatMinuteBucket(timestamp);
  const minuteRef = db.collection('stats').doc('minutes').collection('data').doc(minuteKey);

  return db.runTransaction(async (transaction) => {
    const minuteDoc = await transaction.get(minuteRef);
    
    let minuteStats = minuteDoc.exists ? minuteDoc.data() : {
      count: 0,
      byType: {},
      confidenceSum: 0,
      avgConfidence: 0,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp)
    };

    minuteStats.count += 1;
    minuteStats.byType[detection.className] = (minuteStats.byType[detection.className] || 0) + 1;
    minuteStats.confidenceSum += detection.confidence;
    minuteStats.avgConfidence = minuteStats.confidenceSum / minuteStats.count;

    transaction.set(minuteRef, minuteStats);
  });
}

async function updateHourStats(detection, timestamp) {
  const hourKey = formatHourBucket(timestamp);
  const hourRef = db.collection('stats').doc('hours').collection('data').doc(hourKey);

  return db.runTransaction(async (transaction) => {
    const hourDoc = await transaction.get(hourRef);
    
    let hourStats = hourDoc.exists ? hourDoc.data() : {
      count: 0,
      byType: {},
      confidenceSum: 0,
      avgConfidence: 0,
      timestamp: admin.firestore.Timestamp.fromDate(timestamp)
    };

    hourStats.count += 1;
    hourStats.byType[detection.className] = (hourStats.byType[detection.className] || 0) + 1;
    hourStats.confidenceSum += detection.confidence;
    hourStats.avgConfidence = hourStats.confidenceSum / hourStats.count;

    transaction.set(hourRef, hourStats);
  });
}

async function updateDetectionLog(detection, detectionId, timestamp) {
  const logRef = db.collection('detectionLog').doc(`${timestamp.getTime()}-${detectionId}`);

  await logRef.set({
    timestamp: admin.firestore.Timestamp.fromDate(timestamp),
    className: detection.className,
    confidence: detection.confidence,
    order: timestamp.getTime()
  });

  const oldLogs = await db.collection('detectionLog')
    .orderBy('order', 'desc')
    .offset(500)
    .get();

  if (!oldLogs.empty) {
    const batch = db.batch();
    oldLogs.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }
}

function formatMinuteBucket(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}-${minute}`;
}

function formatHourBucket(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}

// ==========================================
// GET STATS ENDPOINT
// ==========================================

exports.getCurrentStats = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  try {
    const statsDoc = await db.collection('stats')
      .doc('current')
      .collection('metrics')
      .doc('live')
      .get();

    if (!statsDoc.exists) {
      return res.status(200).json({
        totalItems: 0,
        itemsPerMinute: 0,
        itemsPerHour: 0,
        avgConfidence: 0,
        byType: {},
        lastUpdated: null
      });
    }

    res.status(200).json(statsDoc.data());
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// ==========================================
// GET DETECTION LOG ENDPOINT
// ==========================================

exports.getDetectionLog = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');

  try {
    const limit = parseInt(req.query.limit) || 500;
    
    const logsSnapshot = await db.collection('detectionLog')
      .orderBy('order', 'desc')
      .limit(limit)
      .get();

    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp.toDate().toISOString()
    }));

    res.status(200).json({ logs, count: logs.length });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch detection log' });
  }
});