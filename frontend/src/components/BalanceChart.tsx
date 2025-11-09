"use client";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement } from "chart.js";
import type { ChartOptions } from "chart.js";
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function BalanceChart() {
  const data = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Wallet Balance",
        data: [1200, 1600, 1400, 1900, 1750, 2100],
        fill: false,
        borderColor: "#2563EB",
        backgroundColor: "#2563EB",
        tension: 0.3,
        pointBackgroundColor: "#2563EB",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#f3f4f6'
        },
        ticks: {
          callback(value) {
            const numericValue = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(numericValue) ? `$${numericValue.toLocaleString()}` : `$${value}`;
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mt-8 border border-gray-100">
      <h2 className="text-xl font-bold mb-6 text-gray-800">Balance Overview</h2>
      <div className="h-64">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}