import React from 'react';
import { useTimeSeries } from '../hooks/useTimeSeries';

export default function TimeSeriesChart() {
  const { timeSeries, loading } = useTimeSeries('minutes', 24);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Detection Trend (24 Hours)</h2>
        <div className="text-center py-8 text-gray-500">Loading chart...</div>
      </div>
    );
  }

  const maxCount = Math.max(...timeSeries.map(d => d.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Detection Trend (24 Hours)</h2>
      
      <div className="h-64 flex items-end justify-between gap-1">
        {timeSeries.length === 0 ? (
          <div className="w-full text-center py-8 text-gray-500">No data yet</div>
        ) : (
          timeSeries.map((data, index) => {
            const height = (data.count / maxCount) * 100;
            
            return (
              <div
                key={index}
                className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-all cursor-pointer relative group"
                style={{ height: `${height}%`, minHeight: data.count > 0 ? '2px' : '0' }}
                title={`${data.bucket}: ${data.count} detections`}
              >
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {data.count} items
                </div>
              </div>
            );
          })
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Each bar represents 1 minute of detections
      </div>
    </div>
  );
}