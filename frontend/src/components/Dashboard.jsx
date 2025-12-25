import React from 'react';
import { useDetectionStats } from '../hooks/useDetectionStats';
import { useDetectionLog } from '../hooks/useDetectionLog';
import StatsCards from './Stat_cards';
import PlasticDistribution from './PlasticDistribution';
import TimeSeriesChart from './TimeSeries';
import DetectionLog from './DetectionLog';

export default function Dashboard() {
  const { stats, loading: statsLoading } = useDetectionStats();
  const { logs, loading: logsLoading } = useDetectionLog(100);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl font-semibold">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">
          PLASTIWATCH Dashboard
        </h1>

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <PlasticDistribution byType={stats.byType} totalItems={stats.totalItems} />
          <TimeSeriesChart />
        </div>

        {/* Detection Log */}
        <div className="mt-6">
          <DetectionLog logs={logs} loading={logsLoading} />
        </div>
      </div>
    </div>
  );
}