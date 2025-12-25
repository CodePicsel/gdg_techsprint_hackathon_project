import { config } from "../../../config/config";

// Use a neutral name now that this is Render, not Firebase Functions
const API_URL = config.api_url;

/**
 * Send detections to backend
 * @param {Array} detections - Array of detection objects from AI
 * @returns {Promise<any>} Response from backend
 */
export async function ingestDetections(detections) {
  try {
    const response = await fetch(`${API_URL}/ingestDetection`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ detections }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to ingest detections:", error);
    throw error;
  }
}

/**
 * Get current real-time statistics
 * @returns {Promise<any>} Current stats object
 */
export async function getCurrentStats() {
  try {
    const response = await fetch(`${API_URL}/getCurrentStats`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    throw error;
  }
}

/**
 * Get detection log (latest 500)
 * @param {number} limit - Number of logs to retrieve
 * @returns {Promise<any[]>} Detection log array
 */
export async function getDetectionLog(limit = 500) {
  try {
    const response = await fetch(`${API_URL}/getDetectionLog?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.logs;
  } catch (error) {
    console.error("Failed to fetch detection log:", error);
    throw error;
  }
}

/**
 * Get time series data
 * @param {string} period - 'minutes' or 'hours'
 * @param {number} hoursBack - How many hours of data to retrieve
 * @returns {Promise<any[]>} Time series array
 */
export async function getTimeSeries(period = "minutes", hoursBack = 24) {
  try {
    const response = await fetch(
      `${API_URL}/getTimeSeries?period=${period}&hours=${hoursBack}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.timeSeries;
  } catch (error) {
    console.error("Failed to fetch time series:", error);
    throw error;
  }
}
