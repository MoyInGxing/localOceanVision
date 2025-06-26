'use client';

import React, { useState, useEffect } from 'react';
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
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { FaTimes, FaDownload, FaCalendarAlt } from 'react-icons/fa';

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

// 水质数据接口
interface WaterQualityData {
  record_id: string;
  area_id: string;
  record_time: string;
  water_quality_category?: string;
  temperature?: number;
  ph_value?: number;
  dissolved_oxygen?: number;
  turbidity?: number;
  conductivity?: number;
  permanganate?: number;
  ammonia_nitrogen?: number;
  total_phosphorus?: number;
  total_nitrogen?: number;
  chlorophyll_a?: number;
  algal_density?: number;
  device_id?: string;
  station_status?: string;
}

interface WaterQualityChartProps {
  areaId: string;
  areaName: string;
  isOpen: boolean;
  onClose: () => void;
}

const WaterQualityChart: React.FC<WaterQualityChartProps> = ({
  areaId,
  areaName,
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<WaterQualityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'temperature',
    'ph_value'
  ]);

  // 生成模拟数据
  const generateMockData = (areaId: string, timeRange: '7d' | '30d' | '90d' | '1y'): WaterQualityData[] => {
    const now = new Date();
    const timeRangeMs = {
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
    }[timeRange];
    
    const dataPoints = timeRange === '7d' ? 24 : timeRange === '30d' ? 60 : timeRange === '90d' ? 90 : 120;
    const interval = timeRangeMs / dataPoints;
    
    const mockData: WaterQualityData[] = [];
    
    for (let i = 0; i < dataPoints; i++) {
      const recordTime = new Date(now.getTime() - (dataPoints - i) * interval);
      
      // 生成带有趋势的随机数据
      const baseTemp = 20 + Math.sin(i * 0.1) * 5;
      const basePh = 7.0 + Math.sin(i * 0.05) * 1.5;
      const baseOxygen = 6 + Math.sin(i * 0.08) * 2;
      const baseTurbidity = 30 + Math.sin(i * 0.12) * 20;
      
      mockData.push({
        record_id: `mock_${areaId}_${i}`,
        area_id: areaId,
        record_time: recordTime.toISOString(),
        water_quality_category: Math.random() > 0.8 ? 'III' : Math.random() > 0.6 ? 'II' : 'I',
        temperature: baseTemp + (Math.random() - 0.5) * 4,
        ph_value: basePh + (Math.random() - 0.5) * 0.8,
        dissolved_oxygen: baseOxygen + (Math.random() - 0.5) * 2,
        turbidity: baseTurbidity + (Math.random() - 0.5) * 15,
        conductivity: 400 + Math.random() * 200,
        permanganate: 2 + Math.random() * 3,
        ammonia_nitrogen: 0.5 + Math.random() * 1,
        total_phosphorus: 0.05 + Math.random() * 0.1,
        total_nitrogen: 1 + Math.random() * 0.5,
        chlorophyll_a: 5 + Math.random() * 10,
        algal_density: 300 + Math.random() * 400,
        device_id: `device_${areaId}`,
        station_status: 'normal'
      });
    }
    
    return mockData;
  };

  // 获取历史数据
  const fetchHistoryData = async () => {
    if (!areaId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 使用新的温度和pH值专用API端点
      const response = await fetch(`http://localhost:8082/api/water-quality/area/${areaId}/temp-ph`);
      if (!response.ok) {
        throw new Error('获取数据失败');
      }
      
      const result = await response.json();
      const historyData = result.data || [];
      
      // 转换数据格式以匹配现有接口
      const convertedData = historyData.map((item: any) => ({
        record_id: item.record_id,
        area_id: item.area_id,
        record_time: item.record_time,
        temperature: item.temperature,
        ph_value: item.ph_value,
        // 其他字段设为undefined，因为新API只返回温度和pH值
        dissolved_oxygen: undefined,
        turbidity: undefined,
        conductivity: undefined,
        permanganate: undefined,
        ammonia_nitrogen: undefined,
        total_phosphorus: undefined,
        total_nitrogen: undefined,
        chlorophyll_a: undefined,
        algal_density: undefined,
      }));
      
      // 根据时间范围过滤数据
      const now = new Date();
      const timeRangeMs = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000,
      }[timeRange];
      
      const filteredData = convertedData.filter((item: WaterQualityData) => {
        if (!item.record_time) return false;
        const recordTime = new Date(item.record_time);
        return now.getTime() - recordTime.getTime() <= timeRangeMs;
      });
      
      setData(filteredData.sort((a: WaterQualityData, b: WaterQualityData) => 
        new Date(a.record_time).getTime() - new Date(b.record_time).getTime()
      ));
    } catch (err) {
      console.error('API调用失败:', err);
      setError('获取水质数据失败，请稍后重试');
      setData([]);
      
      // 模拟数据备用方案（已注释）
      // console.warn('API调用失败，使用模拟数据:', err);
      // // 使用模拟数据作为后备，但只生成温度和pH值数据
      // const mockData = generateMockData(areaId, timeRange).map(item => ({
      //   ...item,
      //   // 只保留温度和pH值，其他设为undefined
      //   dissolved_oxygen: undefined,
      //   turbidity: undefined,
      //   conductivity: undefined,
      //   permanganate: undefined,
      //   ammonia_nitrogen: undefined,
      //   total_phosphorus: undefined,
      //   total_nitrogen: undefined,
      //   chlorophyll_a: undefined,
      //   algal_density: undefined,
      // }));
      // setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && areaId) {
      fetchHistoryData();
    }
  }, [isOpen, areaId, timeRange]);

  // 准备图表数据
  const chartData = {
    labels: data.map(item => new Date(item.record_time)),
    datasets: [
      ...(selectedMetrics.includes('temperature') ? [{
        label: '温度 (°C)',
        data: data.map(item => item.temperature || null),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'y',
        tension: 0.1,
      }] : []),
      ...(selectedMetrics.includes('ph_value') ? [{
        label: 'pH值',
        data: data.map(item => item.ph_value || null),
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        yAxisID: 'y1',
        tension: 0.1,
      }] : []),

    ],
  };

  // 图表配置
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `${areaName} - 水质历史数据`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            return new Date(context[0].parsed.x).toLocaleString('zh-CN');
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            day: 'MM-dd',
            week: 'MM-dd',
            month: 'yyyy-MM',
          },
        },
        title: {
          display: true,
          text: '时间',
        },
      },
      y: {
        type: 'linear' as const,
        display: selectedMetrics.includes('temperature'),
        position: 'left' as const,
        title: {
          display: true,
          text: '温度 (°C)',
          color: 'rgb(239, 68, 68)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },
      y1: {
        type: 'linear' as const,
        display: selectedMetrics.includes('ph_value'),
        position: 'right' as const,
        title: {
          display: true,
          text: 'pH值',
          color: 'rgb(147, 51, 234)',
        },
        grid: {
          drawOnChartArea: false,
        },
      },

    },
  };

  // 导出数据
  const exportData = () => {
    const csvContent = [
      ['时间', '温度(°C)', 'pH值'].join(','),
      ...data.map(item => [
        new Date(item.record_time).toLocaleString('zh-CN'),
        item.temperature || '',
        item.ph_value || ''
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${areaName}_温度pH数据_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FaCalendarAlt className="h-6 w-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              {areaName} - 历史数据分析
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 控制面板 */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 时间范围选择 */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">时间范围:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">最近7天</option>
                <option value="30d">最近30天</option>
                <option value="90d">最近90天</option>
                <option value="1y">最近1年</option>
              </select>
            </div>

            {/* 指标选择 */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">显示指标:</label>
              {[
                { key: 'temperature', label: '温度', color: 'text-red-500' },
                { key: 'ph_value', label: 'pH值', color: 'text-purple-500' },
              ].map(metric => (
                <label key={metric.key} className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={selectedMetrics.includes(metric.key)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMetrics([...selectedMetrics, metric.key]);
                      } else {
                        setSelectedMetrics(selectedMetrics.filter(m => m !== metric.key));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm ${metric.color}`}>{metric.label}</span>
                </label>
              ))}
            </div>

            {/* 导出按钮 */}
            <button
              onClick={exportData}
              disabled={data.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <FaDownload className="h-4 w-4" />
              <span>导出数据</span>
            </button>
          </div>
        </div>

        {/* 图表内容 */}
        <div className="p-6 overflow-auto" style={{ height: 'calc(90vh - 200px)' }}>
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">加载数据中...</span>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 text-lg mb-2">数据加载失败</div>
                <div className="text-gray-600 mb-4">{error}</div>
                <button
                  onClick={fetchHistoryData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  重新加载
                </button>
              </div>
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-gray-500 text-lg mb-2">暂无数据</div>
                <div className="text-gray-400">该监测点在选定时间范围内没有数据记录</div>
              </div>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <div className="h-96">
              <Line data={chartData} options={chartOptions} />
            </div>
          )}

          {/* 数据统计 */}
          {!loading && !error && data.length > 0 && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'temperature', label: '温度', unit: '°C', color: 'bg-red-50 border-red-200' },
                { key: 'ph_value', label: 'pH值', unit: '', color: 'bg-purple-50 border-purple-200' },
              ].map(metric => {
                const values = data.map(item => (item as any)[metric.key]).filter(v => v != null);
                if (values.length === 0) return null;
                
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                const min = Math.min(...values);
                const max = Math.max(...values);
                
                return (
                  <div key={metric.key} className={`p-4 border rounded-lg ${metric.color}`}>
                    <h4 className="font-medium text-gray-900 mb-2">{metric.label}</h4>
                    <div className="space-y-1 text-sm">
                      <div>平均值: {avg.toFixed(2)} {metric.unit}</div>
                      <div>最小值: {min.toFixed(2)} {metric.unit}</div>
                      <div>最大值: {max.toFixed(2)} {metric.unit}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaterQualityChart;