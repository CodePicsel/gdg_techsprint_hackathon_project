import React from 'react';

export default function StatsCards({ stats }) {
  const cards = [
    {
      title: 'Total Detections',
      value: stats.totalItems.toLocaleString(),
      icon: '🗑️',
      color: 'bg-blue-500'
    },
    {
      title: 'Per Minute',
      value: stats.itemsPerMinute.toFixed(2),
      icon: '⏱️',
      color: 'bg-green-500'
    },
    {
      title: 'Per Hour',
      value: stats.itemsPerHour.toFixed(2),
      icon: '📊',
      color: 'bg-purple-500'
    },
    {
      title: 'Avg Confidence',
      value: `${(stats.avgConfidence * 100).toFixed(1)}%`,
      icon: '🎯',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
            <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}