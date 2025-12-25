import React from 'react';
import { useRealtimeStats } from '../hooks/useRealtimeStats';

export default function Dashboard() {
  const { stats, loading } = useRealtimeStats();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">PLASTIWATCH Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium">Total Detections</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">
            {stats.totalItems}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium">Plastic Types</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">
            {Object.keys(stats.byType).length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-gray-600 text-sm font-medium">Status</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            ✓ Active
          </p>
        </div>
      </div>

      {/* Distribution */}
      <div className="bg-white  rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl text-black font-bold mb-4">Plastic Distribution</h2>
        <div className="space-y-4">
          {Object.entries(stats.byType)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => {
              const percentage = (count / stats.totalItems * 100).toFixed(1);
              return (
                <div key={type}>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{type}</span>
                    <span className="font-bold">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Recent Detections */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Detections</h2>
        <div className="space-y-2">
          {stats.recentDetections.map((detection) => (
            <div
              key={detection.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span className="font-medium">{detection.className}</span>
              <span className="text-sm text-gray-600">
                {(detection.confidence * 100).toFixed(1)}% confidence
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}