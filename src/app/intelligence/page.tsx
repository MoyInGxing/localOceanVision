'use client';

import { useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { FaBrain, FaChartLine, FaRobot, FaClipboardCheck } from 'react-icons/fa';

export default function Intelligence() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  return (
    <ProtectedRoute>
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">智能中心</h1>

          {/* AI 分析卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <AnalysisCard
              title="生长预测"
              icon={<FaChartLine className="w-6 h-6" />}
              description="基于历史数据预测生长趋势"
              status="已完成"
              confidence={95}
              onClick={() => setSelectedAnalysis('growth')}
              isSelected={selectedAnalysis === 'growth'}
            />
            <AnalysisCard
              title="疾病预警"
              icon={<FaBrain className="w-6 h-6" />}
              description="识别潜在健康风险"
              status="进行中"
              confidence={87}
              onClick={() => setSelectedAnalysis('disease')}
              isSelected={selectedAnalysis === 'disease'}
            />
            <AnalysisCard
              title="投喂优化"
              icon={<FaRobot className="w-6 h-6" />}
              description="智能投喂计划生成"
              status="已完成"
              confidence={92}
              onClick={() => setSelectedAnalysis('feeding')}
              isSelected={selectedAnalysis === 'feeding'}
            />
            <AnalysisCard
              title="环境评估"
              icon={<FaClipboardCheck className="w-6 h-6" />}
              description="水质环境综合分析"
              status="已完成"
              confidence={90}
              onClick={() => setSelectedAnalysis('environment')}
              isSelected={selectedAnalysis === 'environment'}
            />
          </div>

          {/* AI 建议面板 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-6">AI 建议</h2>
            <div className="space-y-4">
              <RecommendationItem
                title="优化投喂时间"
                description="建议将早间投喂时间调整到 7:30，可提高采食率约 15%"
                priority="high"
                time="2小时前"
              />
              <RecommendationItem
                title="水质改善"
                description="检测到溶解氧偏低，建议开启增氧设备，维持在 7.5mg/L 以上"
                priority="medium"
                time="4小时前"
              />
              <RecommendationItem
                title="生长状况"
                description="生长速度符合预期，建议维持当前饲养方案"
                priority="low"
                time="1天前"
              />
            </div>
          </div>

          {/* 智能预警 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">智能预警</h2>
            <div className="space-y-4">
              <AlertItem
                type="warning"
                title="水温异常预警"
                description="预计未来 24 小时内水温可能升高至 26°C，建议提前调整降温设备"
                time="10分钟前"
              />
              <AlertItem
                type="info"
                title="饲料库存提醒"
                description="当前饲料库存可维持 7 天，建议及时补充"
                time="1小时前"
              />
              <AlertItem
                type="success"
                title="生长状态良好"
                description="本周生长速度较上周提升 5%，各项指标正常"
                time="2小时前"
              />
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function AnalysisCard({
  title,
  icon,
  description,
  status,
  confidence,
  onClick,
  isSelected
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  status: string;
  confidence: number;
  onClick: () => void;
  isSelected: boolean;
}) {
  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-lg cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-blue-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">{status}</span>
        <span className="text-sm font-medium text-blue-600">{confidence}% 置信度</span>
      </div>
    </div>
  );
}

function RecommendationItem({
  title,
  description,
  priority,
  time
}: {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  time: string;
}) {
  const priorityColors = {
    high: 'bg-red-50 border-red-200',
    medium: 'bg-yellow-50 border-yellow-200',
    low: 'bg-green-50 border-green-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${priorityColors[priority]}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">{time}</span>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function AlertItem({
  type,
  title,
  description,
  time
}: {
  type: 'warning' | 'info' | 'success';
  title: string;
  description: string;
  time: string;
}) {
  const typeColors = {
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200'
  };

  return (
    <div className={`p-4 rounded-lg border ${typeColors[type]}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">{time}</span>
      </div>
      <p className="text-gray-600">{description}</p>
    </div>
  );
} 