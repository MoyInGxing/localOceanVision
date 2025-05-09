'use client';

import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';
import ProtectedRoute from '../components/ProtectedRoute';

// 注册 ChartJS 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface EnvironmentData {
  temperature: ChartData<'line'>;
  oxygen: ChartData<'line'>;
  ph: ChartData<'line'>;
  salinity: ChartData<'line'>;
}

export default function Dashboard() {
  const [environmentData, setEnvironmentData] = useState<EnvironmentData>({
    temperature: {
      labels: [],
      datasets: []
    },
    oxygen: {
      labels: [],
      datasets: []
    },
    ph: {
      labels: [],
      datasets: []
    },
    salinity: {
      labels: [],
      datasets: []
    }
  });
  const [timeRange, setTimeRange] = useState(24); // 默认显示最近24小时

  // 生成时间标签
  const generateTimeLabels = (range: number) => {
    const labels = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setHours(date.getHours() - i);
      labels.push(date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
    }
    return labels;
  };

  // 图表配置
  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0 // 禁用动画以提高性能
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          maxTicksLimit: 8, // 限制显示的刻度数量
          font: {
            size: 10
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: false,
        ticks: {
          precision: 1 // 保留一位小数
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        }
      }
    },
    plugins: {
      legend: {
        display: false // 隐藏图例
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `温度: ${context.raw.toFixed(1)}°C`;
          }
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x',
      intersect: false
    }
  };

  // 模拟实时数据
  useEffect(() => {
    const generateData = (): ChartData<'line'> => {
      const labels = generateTimeLabels(timeRange);
      const data = Array.from({ length: timeRange }, () => Math.random() * 10 + 20);
      
      // 使用移动平均平滑数据
      const smoothedData = data.map((_, index) => {
        const start = Math.max(0, index - 2);
        const end = Math.min(data.length, index + 3);
        const slice = data.slice(start, end);
        return slice.reduce((a, b) => a + b, 0) / slice.length;
      });

      return {
        labels,
        datasets: [
          {
            label: '温度 (°C)',
            data: smoothedData,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.4,
            fill: false,
            pointRadius: 2,
            pointHoverRadius: 5
          }
        ]
      };
    };

    setEnvironmentData(prev => ({
      ...prev,
      temperature: generateData()
    }));
  }, [timeRange]);

  return (
    <ProtectedRoute>
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">主要信息</h1>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg"
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <option value="6">最近6小时</option>
              <option value="12">最近12小时</option>
              <option value="24">最近24小时</option>
              <option value="48">最近48小时</option>
            </select>
          </div>
          
          {/* 实时监控卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MonitorCard title="水温" value="23.5°C" status="normal" />
            <MonitorCard title="溶解氧" value="7.2mg/L" status="warning" />
            <MonitorCard title="pH值" value="7.5" status="normal" />
            <MonitorCard title="盐度" value="35‰" status="normal" />
          </div>

          {/* 图表区域 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4">温度趋势</h2>
            {environmentData.temperature.datasets && (
              <div className="h-[400px]">
                <Line data={environmentData.temperature} options={chartOptions} />
              </div>
            )}
          </div>

          {/* 告警信息 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">最近告警</h2>
            <div className="space-y-4">
              <AlertItem
                type="warning"
                message="溶解氧水平低于阈值"
                time="10分钟前"
              />
              <AlertItem
                type="info"
                message="日常水质检测完成"
                time="1小时前"
              />
              <AlertItem
                type="success"
                message="投喂系统运行正常"
                time="2小时前"
              />
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function MonitorCard({ title, value, status }: { title: string; value: string; status: 'normal' | 'warning' | 'error' }) {
  const statusColors = {
    normal: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-gray-700 mb-2">{value}</div>
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statusColors[status]}`}>
        {status === 'normal' ? '正常' : status === 'warning' ? '警告' : '错误'}
      </div>
    </div>
  );
}

function AlertItem({ type, message, time }: { type: 'warning' | 'info' | 'success'; message: string; time: string }) {
  const typeColors = {
    warning: 'text-yellow-700 bg-yellow-50',
    info: 'text-blue-700 bg-blue-50',
    success: 'text-green-700 bg-green-50'
  };

  return (
    <div className={`p-4 rounded-lg ${typeColors[type]}`}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <span className="text-sm opacity-70">{time}</span>
      </div>
    </div>
  );
} 