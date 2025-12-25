const FUNCTIONS_URL = import.meta.env.VITE_FUNCTIONS_URL;

/**
 * Send detections to Firebase backend
 * @param {Array} detections - Array of detection objects from AI
 * @returns {Promise} Response from Firebase
 */
export async function ingestDetections(detections) {
  try {
    const response = await fetch(`${FUNCTIONS_URL}/ingestDetection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ detections })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to ingest detections:', error);
    throw error;
  }
}

/**
 * Get current real-time statistics
 * @returns {Promise} Current stats object
 */
export async function getCurrentStats() {
  try {
    const response = await fetch(`${FUNCTIONS_URL}/getCurrentStats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    throw error;
  }
}

/**
 * Get detection log (latest 500)
 * @param {number} limit - Number of logs to retrieve
 * @returns {Promise} Detection log array
 */
export async function getDetectionLog(limit = 500) {
  try {
    const response = await fetch(`${FUNCTIONS_URL}/getDetectionLog?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.logs;
  } catch (error) {
    console.error('Failed to fetch detection log:', error);
    throw error;
  }
}

/**
 * Get time series data
 * @param {string} period - 'minutes' or 'hours'
 * @param {number} hoursBack - How many hours of data to retrieve
 * @returns {Promise} Time series array
 */
export async function getTimeSeries(period = 'minutes', hoursBack = 24) {
  try {
    const response = await fetch(
      `${FUNCTIONS_URL}/getTimeSeries?period=${period}&hours=${hoursBack}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.timeSeries;
  } catch (error) {
    console.error('Failed to fetch time series:', error);
    throw error;
  }
}