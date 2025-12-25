import React from 'react';
import { useRealtimeStats } from '../hooks/useRealtimeStats';

export default function Dashboard() {
  const { stats, loading } = useRealtimeStats();

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* <h1 className="text-4xl font-bold text-green-500 mb-8">Dashboard</h1> */}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-900 rounded-xl shadow-md p-6">
          <h3 className="text-gray-400 text-sm font-medium">Total Detections</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">
            {stats.totalItems}
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-md p-6">
          <h3 className="text-gray-400 text-sm font-medium">Plastic Types</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">
            {Object.keys(stats.byType).length}
          </p>
        </div>

        <div className="bg-gray-900 rounded-xl shadow-md p-6">
          <h3 className="text-gray-400 text-sm font-medium">Status</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            ✓ Active
          </p>
        </div>
      </div>

      {/* Distribution */}
      <div className="bg-gray-900  rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl text-green-500 font-bold mb-4">Plastic Distribution</h2>
        <div className="space-y-4 max-h-[10rem]
          overflow-y-auto
              pr-2
              focus:outline-none
              overscroll-y-contain

              [&::-webkit-scrollbar]:w-1
              [&::-webkit-scrollbar-thumb]:rounded-md
              [&::-webkit-scrollbar-track]:rounded-md
              dark:[&::-webkit-scrollbar-track]:bg-blue-800
              dark:[&::-webkit-scrollbar-thumb]:bg-white
        ">
          {Object.entries(stats.byType)
            .sort(([, a], [, b]) => b - a)
            .map(([type, count]) => {
              const percentage = (count / stats.totalItems * 100).toFixed(1);
              return (
                <div key={type}>
                  <div className="flex justify-between mb-1">
                    <span className="font-light text-gray-200">{type}</span>
                    <span className="font-extralight text-gray-200">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Recent Detections */}
      <div className="bg-gray-900 rounded-xl overflow-hidden max-h-[18rem]  shadow-md p-6">
        <h2 className="text-2xl font-bold text-green-500 mb-4">Recent Detections</h2>
        <div className="space-y-2 text-blue-700 max-h-[13rem]
          overflow-y-auto
              text-[1rem]
              pr-2
              focus:outline-none
              overscroll-y-contain

              [&::-webkit-scrollbar]:w-1
              [&::-webkit-scrollbar-thumb]:rounded-md
              [&::-webkit-scrollbar-track]:rounded-md
              dark:[&::-webkit-scrollbar-track]:bg-blue-800
              dark:[&::-webkit-scrollbar-thumb]:bg-white
        "
          tabIndex={0}
            onMouseEnter={() => scrollRef.current?.focus()} // 🔥 focus on hover
            onClick={(e) => (e.stopPropagation()
                )}            // 🔥 prevent flip
            onWheel={(e) => e.stopPropagation()}  
          >
          {stats.recentDetections.map((detection) => (
            <div
              key={detection.id}
              className="flex justify-between items-center p-3 bg-gray-100 rounded-lg"
            >
              <span className="font-medium">{detection.className}</span>
              <span className="text-sm text-gray-600">
                {(detection.confidence * 100).toFixed(1)}% | confidence
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}