'use client';

import { useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { FaPowerOff, FaVideo, FaThermometerHalf, FaTint } from 'react-icons/fa';
import VideoAnalysis from '../components/VideoAnalysis';

export default function Underwater() {
  const [devices, setDevices] = useState({
    camera1: true,
    camera2: false,
    feeder1: false,
    feeder2: false
  });

  const toggleDevice = (deviceId: keyof typeof devices) => {
    setDevices(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  return (
    <ProtectedRoute>
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">水下系统</h1>

          {/* 视频分析区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">摄像头 1</h2>
              <VideoAnalysis isActive={devices.camera1} cameraId={1} />
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">摄像头 2</h2>
              <VideoAnalysis isActive={devices.camera2} cameraId={2} />
            </div>
          </div>

          {/* 设备控制面板 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <DeviceCard
              title="摄像头 1"
              icon={<FaVideo className="w-6 h-6" />}
              status={devices.camera1}
              onToggle={() => toggleDevice('camera1')}
              details="前方水域监控"
            />
            <DeviceCard
              title="摄像头 2"
              icon={<FaVideo className="w-6 h-6" />}
              status={devices.camera2}
              onToggle={() => toggleDevice('camera2')}
              details="后方水域监控"
            />
            <DeviceCard
              title="投饵器 1"
              icon={<FaTint className="w-6 h-6" />}
              status={devices.feeder1}
              onToggle={() => toggleDevice('feeder1')}
              details="自动投饵系统"
            />
          </div>

          {/* 水质监测 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-6">水质监测</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <WaterQualityCard
                icon={<FaThermometerHalf className="w-6 h-6 text-red-500" />}
                parameter="水温"
                value="23.5°C"
                status="normal"
              />
              <WaterQualityCard
                icon={<FaTint className="w-6 h-6 text-blue-500" />}
                parameter="溶解氧"
                value="7.2mg/L"
                status="warning"
              />
              <WaterQualityCard
                icon={<FaTint className="w-6 h-6 text-purple-500" />}
                parameter="pH值"
                value="7.5"
                status="normal"
              />
              <WaterQualityCard
                icon={<FaTint className="w-6 h-6 text-green-500" />}
                parameter="浊度"
                value="2.3 NTU"
                status="normal"
              />
            </div>
          </div>

          {/* 设备日志 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">设备日志</h2>
            <div className="space-y-4">
              <LogItem
                time="10:30"
                device="摄像头 1"
                action="开启"
                status="success"
              />
              <LogItem
                time="10:15"
                device="投饵器 1"
                action="投放饲料"
                status="success"
              />
              <LogItem
                time="09:45"
                device="水质监测器"
                action="数据采集"
                status="info"
              />
              <LogItem
                time="09:30"
                device="摄像头 2"
                action="连接断开"
                status="error"
              />
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function DeviceCard({
  title,
  icon,
  status,
  onToggle,
  details
}: {
  title: string;
  icon: React.ReactNode;
  status: boolean;
  onToggle: () => void;
  details: string;
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        </div>
        <button
          onClick={onToggle}
          className={`p-2 rounded-full ${
            status ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
          }`}
        >
          <FaPowerOff />
        </button>
      </div>
      <p className="text-gray-600">{details}</p>
      <div className="mt-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
            status ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}
        >
          {status ? '运行中' : '已关闭'}
        </span>
      </div>
    </div>
  );
}

function WaterQualityCard({
  icon,
  parameter,
  value,
  status
}: {
  icon: React.ReactNode;
  parameter: string;
  value: string;
  status: 'normal' | 'warning' | 'error';
}) {
  const statusColors = {
    normal: 'text-green-500',
    warning: 'text-yellow-500',
    error: 'text-red-500'
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h3 className="text-sm font-medium text-gray-900">{parameter}</h3>
      </div>
      <div className="text-2xl font-bold text-gray-700 mb-1">{value}</div>
      <div className={statusColors[status]}>
        {status === 'normal' ? '正常' : status === 'warning' ? '警告' : '异常'}
      </div>
    </div>
  );
}

function LogItem({
  time,
  device,
  action,
  status
}: {
  time: string;
  device: string;
  action: string;
  status: 'success' | 'error' | 'info';
}) {
  const statusColors = {
    success: 'text-green-700 bg-green-50',
    error: 'text-red-700 bg-red-50',
    info: 'text-blue-700 bg-blue-50'
  };

  return (
    <div className={`p-4 rounded-lg ${statusColors[status]}`}>
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium">{device}</span>
          <span className="mx-2">-</span>
          <span>{action}</span>
        </div>
        <span className="text-sm opacity-70">{time}</span>
      </div>
    </div>
  );
} 