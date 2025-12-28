import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PlasticDistribution({ stats }) {
  const entries = Object.entries(stats.byType || {}).sort(
    ([, a], [, b]) => b - a
  );

  if (entries.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl text-green-500 font-bold mb-4">
          Plastic Distribution
        </h2>
        <div className="text-center py-8 text-gray-400">No data yet</div>
      </div>
    );
  }

  const labels = entries.map(([type]) => type);
  const dataValues = entries.map(([, count]) => count);

  const data = {
    labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: [
          "#22c55e",
          "#16a34a",
          "#15803d",
          "#4ade80",
          "#22c55e80",
          "#16a34a80",
          "#15803d80",
          "#4ade8080",
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    cutout: "60%",
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const count = ctx.raw;
            const percentage = (
              (count / stats.totalItems) *
              100
            ).toFixed(1);
            return `${ctx.label}: ${count} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-gray-900 rounded-xl shadow-md p-6 mb-8">
      <h2 className="text-2xl text-green-500 font-bold mb-4">
        Plastic Distribution
      </h2>

      <div className="flex items-center gap-6">
        {/* Ring chart */}
        <div className="w-40 h-40 md:w-48 md:h-48">
          <Doughnut data={data} options={options} />
        </div>

        {/* Scrollable legend, matching your original list */}
        <div
          className="space-y-2 max-h-[10rem] overflow-y-auto pr-2
            [&::-webkit-scrollbar]:w-1
            [&::-webkit-scrollbar-thumb]:rounded-md
            [&::-webkit-scrollbar-track]:rounded-md
            dark:[&::-webkit-scrollbar-track]:bg-blue-800
            dark:[&::-webkit-scrollbar-thumb]:bg-white"
        >
          {entries.map(([type, count]) => {
            const percentage = (
              (count / stats.totalItems) *
              100
            ).toFixed(1);
            return (
              <div key={type}>
                <div className="flex justify-between mb-1">
                  <span className="font-light text-gray-200">{type}</span>
                  <span className="font-extralight text-gray-200">
                    {count} ({percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
