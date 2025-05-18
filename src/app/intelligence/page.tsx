'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '../components/ProtectedRoute'; // 假设此组件存在于您的项目中
import { FaBrain, FaChartLine, FaRobot, FaClipboardCheck, FaTimes, FaLightbulb } from 'react-icons/fa'; // Added FaLightbulb
import { FiSun, FiCloud, FiCloudRain, FiCloudDrizzle, FiWind, FiThermometer } from 'react-icons/fi'; // 天气图标
import { Line, Bar } from 'react-chartjs-2';
import Image from 'next/image';
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

// 可能的天气描述和对应的图标
const weatherOptions = [
  { description: '晴朗', icon: <FiSun className="w-8 h-8 text-yellow-400" /> },
  { description: '多云', icon: <FiCloud className="w-8 h-8 text-gray-400" /> },
  { description: '小雨', icon: <FiCloudRain className="w-8 h-8 text-blue-400" /> },
  { description: '阵雨', icon: <FiCloudDrizzle className="w-8 h-8 text-blue-300" /> },
  { description: '有风', icon: <FiWind className="w-8 h-8 text-gray-500" /> },
  { description: '阴天', icon: <FiCloud className="w-8 h-8 text-gray-400" /> }, // 阴天
  { description: '雷阵雨', icon: <FiCloudRain className="w-8 h-8 text-blue-500" /> }, // 雷阵雨
  { description: '多云转晴', icon: <FiCloud className="w-8 h-8 text-gray-400" /> }, // 多云转晴，可以用多云图标
  { description: '晴转多云', icon: <FiSun className="w-8 h-8 text-yellow-400" /> }, // 晴转多云，可以用晴天图标
];

// 获取从当前日期开始的未来7天的日期 (月/日)
const getNextSevenDays = () => {
  const nextSevenDates = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(today); // 创建一个新日期对象，避免修改 today
    nextDay.setDate(today.getDate() + i); // 设置为 i 天后的日期

    const month = (nextDay.getMonth() + 1).toString().padStart(2, '0'); // 月份从0开始，加1，并补零
    const day = nextDay.getDate().toString().padStart(2, '0');     // 日期补零

    nextSevenDates.push(`${month}/${day}`);
  }
  return nextSevenDates;
};


// 定义分析类型
type AnalysisType = 'growth' | 'disease' | 'feeding' | 'environment';

// 定义图表数据和建议的接口
interface AnalysisChartInfo {
  data: ChartData<'line'> | ChartData<'bar'>;
  type: 'line' | 'bar';
  title: string;
  adviceText: string; // 新增建议文本字段
}



export default function Intelligence() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<WeatherData[]>([]);
  const chartSectionRef = useRef<HTMLDivElement>(null); // Ref for scrolling to chart

   // 模拟获取天气数据
  useEffect(() => {
    const generateRandomWeatherData = (): WeatherData[] => {
      const days = getNextSevenDays(); // 获取接下来7天的日期字符串 (月/日)
      const randomData: WeatherData[] = [];

      for (let i = 0; i < 7; i++) {
        // 随机选择一个天气选项 (描述和图标)
        const randomOption = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];

        // 随机生成温度，例如高温在 20-35°C，低温在 10-25°C
        // 确保低温低于高温
        let tempHigh = Math.floor(Math.random() * (35 - 20 + 1)) + 20; // 高温在 20-35
        let tempLow = Math.floor(Math.random() * (25 - 10 + 1)) + 10; // 低温在 10-25

        // 如果生成的低温大于等于高温，则重新生成低温
        while (tempLow >= tempHigh) {
          // 确保低温在 10 到 高温-5 之间，避免温差过小或低温过低
          tempLow = Math.floor(Math.random() * (tempHigh - 5 - 10 + 1)) + 10;
          if (tempLow < 10) tempLow = 10; // 确保低温不低于10
        }


        randomData.push({
          day: days[i], // 使用生成的 "月/日" 字符串
          icon: randomOption.icon, // 使用随机选择的图标
          tempHigh: tempHigh,     // 使用随机生成的高温
          tempLow: tempLow,      // 使用随机生成的低温
          description: randomOption.description, // 使用随机选择的描述
        });
      }
      return randomData;
    };

    // 生成随机天气数据并设置到 state 中
    const randomWeatherData = generateRandomWeatherData();
    setWeatherForecast(randomWeatherData);

  }, []); // 依赖项为空数组，表示只在组件挂载时运行一次

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
            size: 12, // Adjusted font size for more labels
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

// 模拟图表数据和建议
  const analysisChartData: Record<AnalysisType, AnalysisChartInfo> = {
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
      adviceText: '根据当前生长曲线，预计未来几周生长态势良好。建议保持现有饲料配方和投喂量，并密切关注水质变化，确保溶氧充足。可考虑在第4周后适当增加高蛋白饲料比例，以促进快速增重。',
    },
    disease: {
      type: 'bar',
      title: '主要疾病风险评估',
      data: {
        labels: ['白点病', '烂鳃病', '肠炎', '弧菌病'],
        datasets: [
          {
            label: '风险概率 (%)',
            // 将概率值改为随机生成 (0-50 之间的整数)
            data: [
              Math.floor(Math.random() * 51), 
              Math.floor(Math.random() * 51),
              Math.floor(Math.random() * 51),
              Math.floor(Math.random() * 51)
            ],
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
      adviceText: '当前主要疾病风险评估如下（随机生成概率，仅供参考）：\n\n' +
        '白点病风险：基于当前环境数据，风险概率较低。\n' +
        '烂鳃病风险：水质指标波动可能导致风险略有升高，需警惕。\n' +
        '肠炎风险：饲料新鲜度和投喂量控制良好，风险较低。\n' +
        '弧菌病风险：水温升高可能导致风险增加，建议加强预防。\n\n' +
        '综合建议：密切关注鱼群摄食及活动状态，定期进行水质检测。在水温较高或水质有波动时，考虑适量使用益生菌或进行预防性消毒。',
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
      // 具体展示策略ABC的内容
      adviceText: '数据显示不同投喂策略对饲料转化率（FCR）的影响：\n\n' +
        '策略A (当前)：每日投喂 2 次（上午 8:00，下午 4:00），每次按经验投喂至七八分饱。此策略操作简便，但FCR相对较高。\n\n' +
        '策略B (优化)：每日投喂 3 次（上午 7:30，中午 12:00，下午 5:30），每次投喂量根据鱼体规格、水温及天气情况动态调整。例如，水温适宜且天气晴好时，可适当增加投喂量；水温过高或过低、阴雨天时减少投喂量。此策略能更好地匹配鱼的生理需求，显著降低FCR（1.3）。\n\n' +
        '策略C (实验)：每日少量多次投喂 4 次（上午 7:00, 11:00, 下午 3:00, 下午 6:00），并结合自动投喂设备精准控制每次投喂时长和量，使用特定配方饲料。此策略在理论上能进一步提升消化吸收效率，但FCR提升不明显（1.4），且操作复杂。\n\n' +
        '建议：基于现有数据，“策略B (优化)”在降低FCR和易操作性之间取得了最佳平衡。建议全面推广策略B。持续监测FCR数据，并根据实际情况进行微调。',
    },
    environment: {
      type: 'line',
      title: '国控水站水质评价指标',
      data: {
        labels: ['1天前', '12小时前', '6小时前', '当前', '预计6小时后', '预计12小时后'],
        datasets: [
          {
            label: 'pH值',
            data: [7.8, 7.9, 7.7, 8.0, 7.9, 7.8],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            tension: 0.1,
            yAxisID: 'y',
          },
          {
            label: '溶解氧 (mg/L)',
            data: [7.2, 7.5, 7.3, 7.6, 7.4, 7.1],
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.5)',
            tension: 0.1,
            yAxisID: 'y',
          },
          {
            label: '高锰酸盐指数 (mg/L)',
            data: [2.5, 2.7, 2.6, 2.8, 2.5, 2.4],
            borderColor: 'rgb(139, 92, 246)',
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            tension: 0.1,
            yAxisID: 'y',
          },
          {
            label: '氨氮 (mg/L)',
            data: [0.1, 0.15, 0.12, 0.18, 0.16, 0.13],
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.5)',
            tension: 0.1,
            yAxisID: 'y1',
          },
          {
            label: '总磷 (mg/L)',
            data: [0.02, 0.03, 0.025, 0.035, 0.03, 0.028],
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.5)',
            tension: 0.1,
            yAxisID: 'y1',
          },
        ],
      },
      adviceText: '当前各项水质指标总体在可控范围内，但需注意氨氮和总磷有轻微上升趋势。建议检查排污系统，适度增加换水量，并考虑使用底质改良剂。未来12小时溶解氧有下降趋势，请确保增氧设备正常运行，必要时增加开启时长。',
    },
  };

  // 更新环境评估图表的Y轴配置
  const environmentChartOptions: ChartOptions<'line'> = {
    ...commonChartOptions,
    scales: {
        ...commonChartOptions.scales,
        y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
                display: true,
                text: 'pH / DO (mg/L) / Perm. Index (mg/L)',
                color: '#4A5568',
            },
            ticks: { color: '#4A5568' },
            grid: { drawOnChartArea: true, color: '#E2E8F0' }, // Ensure grid is drawn for primary axis
        },
        y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
                display: true,
                text: 'NH₃-N (mg/L) / TP (mg/L)',
                color: '#4A5568',
            },
            ticks: { color: '#4A5568' },
            grid: { drawOnChartArea: false }, 
        },
    }
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
              status="已完成"
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
              <div className="h-[400px] md:h-[500px] mb-6"> {/* Added margin-bottom to chart container */}
                {currentChartInfo.type === 'line' ? (
                  <Line 
                    data={currentChartInfo.data as ChartData<'line'>} 
                    options={selectedAnalysis === 'environment' ? 
                             (environmentChartOptions as ChartOptions<'line'>) :
                             (commonChartOptions as ChartOptions<'line'>)} 
                  />
                ) : (
                  <Bar 
                    data={currentChartInfo.data as ChartData<'bar'>} 
                    options={commonChartOptions as ChartOptions<'bar'>}
                  />
                )}
              </div>
              {/* 文字建议区 */}
              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center">
                  <FaLightbulb className="w-5 h-5 mr-2 text-blue-600" />
                  图表解读与建议
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {currentChartInfo.adviceText}
                </p>
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
          <WaterQualityScore />
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

function WaterQualityScore() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-10 flex flex-col items-center">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">水质质量评分</h2>
      <div className="w-full flex justify-center">
        <Image
          src="/img/evaluation_index.png"
          alt="水质质量评分"
          width={480}
          height={320}
          className="rounded-lg shadow"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
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
