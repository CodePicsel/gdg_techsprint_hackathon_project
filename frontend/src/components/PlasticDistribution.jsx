import React from 'react';

export default function PlasticDistribution({ byType, totalItems }) {
  const sortedTypes = Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10); // Top 10 types

  if (sortedTypes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-2xl font-bold mb-4">Plastic Distribution</h2>
        <div className="text-center py-8 text-gray-500">No data yet</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
      <h2 className="text-2xl font-bold mb-4">Plastic Distribution</h2>
      
      <div className="space-y-4">
        {sortedTypes.map(([type, count]) => {
          const percentage = ((count / totalItems) * 100).toFixed(1);
          
          return (
            <div key={type}>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{type}</span>
                <span className="text-sm font-semibold text-gray-900">
                  {count} ({percentage}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}