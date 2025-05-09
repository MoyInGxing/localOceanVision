'use client';

import { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';
import ProtectedRoute from '../components/ProtectedRoute';
import { FaDownload, FaFilter, FaSearch } from 'react-icons/fa';

// 注册 ChartJS 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DataCenter() {
  const [dateRange, setDateRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeRange, setTimeRange] = useState(7); // 默认显示最近7天

  // 生成时间标签
  const generateTimeLabels = (range: number) => {
    const labels = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }));
    }
    return labels;
  };

  // 模拟数据
  const temperatureData: ChartData<'line'> = {
    labels: generateTimeLabels(timeRange),
    datasets: [
      {
        label: '水温 (°C)',
        data: Array.from({ length: timeRange }, () => Math.random() * 10 + 20),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  const productionData: ChartData<'bar'> = {
    labels: generateTimeLabels(timeRange),
    datasets: [
      {
        label: '产量 (吨)',
        data: Array.from({ length: timeRange }, () => Math.random() * 30 + 50),
        backgroundColor: 'rgba(54, 162, 235, 0.5)'
      }
    ]
  };

  // 图表配置
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        beginAtZero: false
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
      }
    }
  };

  return (
    <ProtectedRoute>
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">数据中心</h1>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <FaDownload />
                导出数据
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FaFilter />
                筛选
              </button>
            </div>
          </div>

          {/* 数据筛选器 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="flex gap-4 items-center">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="day">今日</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="year">本年</option>
              </select>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                <option value="temperature">水温</option>
                <option value="oxygen">溶解氧</option>
                <option value="ph">pH值</option>
                <option value="production">产量</option>
              </select>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <option value="3">最近3天</option>
                <option value="7">最近7天</option>
                <option value="14">最近14天</option>
                <option value="30">最近30天</option>
              </select>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索数据..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg pl-10"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-6">水温趋势</h2>
              <div className="h-[400px]">
                <Line data={temperatureData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-6">产量统计</h2>
              <div className="h-[400px]">
                <Bar data={productionData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-6">详细数据</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      水温 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      溶解氧 (mg/L)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      pH值
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(5)].map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        2024-01-{String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(23 + Math.random()).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(7 + Math.random()).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(7.5 + Math.random() * 0.5).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          正常
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
} 