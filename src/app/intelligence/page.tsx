'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '../components/ProtectedRoute'; // 假设此组件存在于您的项目中
import { FaBrain, FaChartLine, FaRobot, FaClipboardCheck, FaTimes } from 'react-icons/fa';
import { FiSun, FiCloud, FiCloudRain, FiCloudDrizzle, FiWind, FiThermometer } from 'react-icons/fi'; // 天气图标
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
  ChartData,
  ChartOptions,
} from 'chart.js';

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

// 定义天气数据接口
interface WeatherData {
  day: string;
  icon: React.ReactNode;
  tempHigh: number;
  tempLow: number;
  description: string;
}

// 定义分析类型
type AnalysisType = 'growth' | 'disease' | 'feeding' | 'environment';

export default function Intelligence() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<WeatherData[]>([]);
  const chartSectionRef = useRef<HTMLDivElement>(null); // Ref for scrolling to chart

  // 模拟获取天气数据
  useEffect(() => {
    const mockWeatherData: WeatherData[] = [
      { day: '周一', icon: <FiSun className="w-8 h-8 text-yellow-400" />, tempHigh: 28, tempLow: 22, description: '晴朗' },
      { day: '周二', icon: <FiCloud className="w-8 h-8 text-gray-400" />, tempHigh: 26, tempLow: 21, description: '多云' },
      { day: '周三', icon: <FiCloudRain className="w-8 h-8 text-blue-400" />, tempHigh: 24, tempLow: 20, description: '小雨' },
      { day: '周四', icon: <FiCloudDrizzle className="w-8 h-8 text-blue-300" />, tempHigh: 25, tempLow: 19, description: '阵雨' },
      { day: '周五', icon: <FiSun className="w-8 h-8 text-yellow-400" />, tempHigh: 29, tempLow: 23, description: '晴转多云' },
      { day: '周六', icon: <FiWind className="w-8 h-8 text-gray-500" />, tempHigh: 27, tempLow: 22, description: '有风' },
      { day: '周日', icon: <FiCloud className="w-8 h-8 text-gray-400" />, tempHigh: 26, tempLow: 20, description: '阴' },
    ];
    setWeatherForecast(mockWeatherData);
  }, []);

  const handleAnalysisCardClick = (analysisType: AnalysisType) => {
    setSelectedAnalysis(analysisType);
    // Scroll to chart section after state update
    setTimeout(() => {
      chartSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // 通用图表配置
  const commonChartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#4A5568', // text-gray-700
          font: {
            size: 14,
          }
        }
      },
      title: {
        display: true,
        color: '#2D3748', // text-gray-800
        font: {
          size: 18,
          weight: 'bold',
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#4A5568' }, // text-gray-700
        grid: { color: '#E2E8F0' } // border-gray-200
      },
      y: {
        ticks: { color: '#4A5568' }, // text-gray-700
        grid: { color: '#E2E8F0' } // border-gray-200
      }
    }
  };

  // 模拟图表数据
  const analysisChartData: Record<AnalysisType, { data: ChartData<'line'> | ChartData<'bar'>, type: 'line' | 'bar', title: string }> = {
    growth: {
      type: 'line',
      title: '生长预测趋势',
      data: {
        labels: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'],
        datasets: [
          {
            label: '预计重量 (kg)',
            data: [0.5, 0.8, 1.2, 1.7, 2.3, 3.0],
            borderColor: 'rgb(59, 130, 246)', // blue-500
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.1,
          },
        ],
      },
    },
    disease: {
      type: 'bar',
      title: '主要疾病风险评估',
      data: {
        labels: ['白点病', '烂鳃病', '肠炎', '弧菌病'],
        datasets: [
          {
            label: '风险概率 (%)',
            data: [15, 25, 10, 30],
            backgroundColor: [
              'rgba(239, 68, 68, 0.6)', // red-500
              'rgba(245, 158, 11, 0.6)', // amber-500
              'rgba(234, 179, 8, 0.6)', // yellow-500
              'rgba(139, 92, 246, 0.6)', // violet-500
            ],
            borderColor: [
                'rgb(239, 68, 68)',
                'rgb(245, 158, 11)',
                'rgb(234, 179, 8)',
                'rgb(139, 92, 246)',
            ],
            borderWidth: 1,
          },
        ],
      },
    },
    feeding: {
      type: 'bar',
      title: '投喂策略效果对比',
      data: {
        labels: ['策略A (当前)', '策略B (优化)', '策略C (实验)'],
        datasets: [
          {
            label: '饲料转化率 (FCR)',
            data: [1.5, 1.3, 1.4],
            backgroundColor: 'rgba(16, 185, 129, 0.6)', // green-500
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
          },
        ],
      },
    },
    environment: {
      type: 'line',
      title: '关键环境参数稳定性',
      data: {
        labels: ['1天前', '12小时前', '6小时前', '当前', '预计6小时后', '预计12小时后'],
        datasets: [
          {
            label: '溶解氧 (mg/L)',
            data: [7.2, 7.5, 7.3, 7.6, 7.4, 7.1],
            borderColor: 'rgb(34, 197, 94)', // green-600
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            tension: 0.1,
          },
          {
            label: '水温 (°C)',
            data: [22, 22.5, 22.3, 23, 23.2, 22.8],
            borderColor: 'rgb(239, 68, 68)', // red-500
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            tension: 0.1,
          },
        ],
      },
    },
  };

  const currentChartInfo = selectedAnalysis ? analysisChartData[selectedAnalysis] : null;


  return (
    <ProtectedRoute>
      <main className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center md:text-left">智能中心</h1>

          {/* AI 分析卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <AnalysisCard
              title="生长预测"
              icon={<FaChartLine className="w-6 h-6 text-blue-500" />}
              description="基于历史数据预测生长趋势"
              status="已完成"
              confidence={95}
              onClick={() => handleAnalysisCardClick('growth')}
              isSelected={selectedAnalysis === 'growth'}
            />
            <AnalysisCard
              title="疾病预警"
              icon={<FaBrain className="w-6 h-6 text-red-500" />}
              description="识别潜在健康风险"
              status="进行中"
              confidence={87}
              onClick={() => handleAnalysisCardClick('disease')}
              isSelected={selectedAnalysis === 'disease'}
            />
            <AnalysisCard
              title="投喂优化"
              icon={<FaRobot className="w-6 h-6 text-green-500" />}
              description="智能投喂计划生成"
              status="已完成"
              confidence={92}
              onClick={() => handleAnalysisCardClick('feeding')}
              isSelected={selectedAnalysis === 'feeding'}
            />
            <AnalysisCard
              title="环境评估"
              icon={<FaClipboardCheck className="w-6 h-6 text-purple-500" />}
              description="水质环境综合分析"
              status="已完成"
              confidence={90}
              onClick={() => handleAnalysisCardClick('environment')}
              isSelected={selectedAnalysis === 'environment'}
            />
          </div>

          {/* 未来七天天气预报 */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-10">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center">
              <FiThermometer className="w-7 h-7 mr-3 text-blue-500" />
              未来七天天气预报
            </h2>
            {weatherForecast.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {weatherForecast.map((weatherDay) => (
                  <WeatherDayCard key={weatherDay.day} weather={weatherDay} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500">天气数据加载中...</p>
            )}
          </div>

          {/* 详细图表展示区 */}
          {selectedAnalysis && currentChartInfo && (
            <div ref={chartSectionRef} className="bg-white p-6 rounded-xl shadow-lg mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">{currentChartInfo.title}</h2>
                <button
                  onClick={() => setSelectedAnalysis(null)}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  aria-label="关闭图表"
                >
                  <FaTimes className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="h-[400px] md:h-[500px]">
                {currentChartInfo.type === 'line' ? (
                  <Line
                    data={currentChartInfo.data as ChartData<'line'>}
                    options={{ ...commonChartOptions, plugins: { ...commonChartOptions.plugins, title: { ...commonChartOptions.plugins?.title, text: currentChartInfo.title } } } as ChartOptions<'line'>}
                  />
                ) : (
                  <Bar
                    data={currentChartInfo.data as ChartData<'bar'>}
                    options={{ ...commonChartOptions, plugins: { ...commonChartOptions.plugins, title: { ...commonChartOptions.plugins?.title, text: currentChartInfo.title } } } as ChartOptions<'bar'>}
                  />
                )}
              </div>
            </div>
          )}


          {/* AI 建议面板 */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-10">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">AI 建议</h2>
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
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold text-gray-700 mb-6">智能预警</h2>
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

// 天气卡片组件
function WeatherDayCard({ weather }: { weather: WeatherData }) {
  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg shadow hover:shadow-md transition-shadow">
      <p className="text-md font-semibold text-gray-700 mb-2">{weather.day}</p>
      <div className="mb-2">
        {weather.icon}
      </div>
      <p className="text-sm text-gray-600 mb-1">{`${weather.tempLow}°C / ${weather.tempHigh}°C`}</p>
      <p className="text-xs text-gray-500 text-center">{weather.description}</p>
    </div>
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
      className={`bg-white p-6 rounded-xl shadow-lg cursor-pointer transition-all duration-300 ease-in-out hover:shadow-xl ${
        isSelected ? 'ring-2 ring-blue-500 scale-105' : 'hover:scale-105'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="p-2 bg-gray-100 rounded-full">{icon}</div>
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
      </div>
      <p className="text-sm text-gray-600 mb-4 h-12 overflow-hidden">{description}</p>
      <div className="flex justify-between items-center">
        <span className={`text-xs px-2 py-1 rounded-full ${status === '已完成' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{status}</span>
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
  const priorityStyles = {
    high: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      text: 'text-red-700',
      title: 'text-red-800'
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      text: 'text-yellow-700',
      title: 'text-yellow-800'
    },
    low: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      text: 'text-green-700',
      title: 'text-green-800'
    }
  };
  const styles = priorityStyles[priority];

  return (
    <div className={`p-4 rounded-lg border-l-4 ${styles.bg} ${styles.border} shadow-sm`}>
      <div className="flex justify-between items-start mb-1">
        <h3 className={`text-md font-semibold ${styles.title}`}>{title}</h3>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
      <p className={`text-sm ${styles.text}`}>{description}</p>
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
  const typeStyles = {
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      iconColor: 'text-yellow-500',
      title: 'text-yellow-800',
      text: 'text-yellow-700'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-400',
      iconColor: 'text-blue-500',
      title: 'text-blue-800',
      text: 'text-blue-700'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-400',
      iconColor: 'text-green-500',
      title: 'text-green-800',
      text: 'text-green-700'
    }
  };
  const styles = typeStyles[type];

  return (
    <div className={`p-4 rounded-lg border-l-4 ${styles.bg} ${styles.border} shadow-sm`}>
      <div className="flex justify-between items-start mb-1">
         <h3 className={`text-md font-semibold ${styles.title}`}>{title}</h3>
        <span className="text-xs text-gray-500">{time}</span>
      </div>
      <p className={`text-sm ${styles.text}`}>{description}</p>
    </div>
  );
}
