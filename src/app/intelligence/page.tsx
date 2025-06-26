'use client';

import { useState, useEffect, useRef } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { FaBrain, FaChartLine, FaRobot, FaClipboardCheck, FaTimes, FaLightbulb, FaFish, FaUpload, FaCheck } from 'react-icons/fa';
import { FiSun, FiCloud, FiCloudRain, FiCloudDrizzle, FiWind, FiThermometer } from 'react-icons/fi';
import { Line, Bar } from 'react-chartjs-2';
import AgentChatWindow from '../components/AgentChatWindow'; 
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
type AnalysisType = 'growth' | 'disease' | 'feeding' | 'environment' | 'recognition';

// 定义图表数据和建议的接口
interface AnalysisChartInfo {
  data: ChartData<'line'> | ChartData<'bar'>;
  type: 'line' | 'bar';
  title: string;
  adviceText: string;
  // 新增识别相关字段
  recognitionResult?: {
    name: string;
    score: number;
    description?: string;
  } | null;
  imagePreview?: string | null;
}

// 新增：鱼类识别结果接口
/* interface FishRecognitionResult {
  name: string;
  score: number;
  description: string;
} */

export default function Intelligence() {
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisType | null>(null);
  const [weatherForecast, setWeatherForecast] = useState<WeatherData[]>([]);
  // const [isUploading, setIsUploading] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const chartSectionRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          color: '#4A5568',
          font: {
            size: 12,
          }
        }
      },
      title: {
        display: true,
        color: '#2D3748',
        font: {
          size: 18,
          weight: 'bold',
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#4A5568' },
        grid: { color: '#E2E8F0' }
      },
      y: {
        ticks: { color: '#4A5568' },
        grid: { color: '#E2E8F0' }
      }
    }
  };

  // 模拟图表数据和建议
  const [analysisChartData, setAnalysisChartData] = useState<Record<AnalysisType, AnalysisChartInfo>>({
    growth: {
      type: 'line',
      title: '生长预测趋势',
      data: {
        labels: ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周'],
        datasets: [
          {
            label: '预计重量 (kg)',
            data: [0.5, 0.8, 1.2, 1.7, 2.3, 3.0],
            borderColor: 'rgb(59, 130, 246)',
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
            data: [15, 25, 10, 30],
            backgroundColor: [
              'rgba(239, 68, 68, 0.6)',
              'rgba(245, 158, 11, 0.6)',
              'rgba(234, 179, 8, 0.6)',
              'rgba(139, 92, 246, 0.6)',
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
      adviceText: '当前弧菌病和烂鳃病风险较高。建议加强水体消毒，每周使用1-2次益生菌调节水质。密切观察鱼群活动和摄食情况，如有异常立即隔离并考虑使用针对性药物预防。注意控制养殖密度，避免水质恶化。',
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
            backgroundColor: 'rgba(16, 185, 129, 0.6)',
            borderColor: 'rgb(16, 185, 129)',
            borderWidth: 1,
          },
        ],
      },
      adviceText: '数据显示"策略B (优化)"的饲料转化率最佳。建议全面推广策略B，该策略可能涉及调整投喂时间和每日投喂次数。持续监测FCR数据，并根据鱼体规格和水温变化进行微调。可小范围尝试"策略C"以探索进一步优化的可能性。',
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
    recognition: {
      type: 'bar',
      title: '鱼类图片识别',
      data: {
        labels: ['识别中...'],
        datasets: [
          {
            label: '置信度',
            data: [0],
            backgroundColor: 'rgba(59, 130, 246, 0.6)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
          },
        ],
      },
      adviceText: '请上传鱼类图片进行识别，系统将分析鱼的种类并提供相关信息。',
      recognitionResult: null,
      imagePreview: null
    }
  });

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
            grid: { drawOnChartArea: true, color: '#E2E8F0' },
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

// 处理图片上传
const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // 验证图片类型
  if (!file.type.match('image.*')) {
    setRecognitionError('请上传有效的图片文件');
    setRecognitionStatus('error');
    return;
  }

  // 验证图片大小 (限制为5MB)
  if (file.size > 5 * 1024 * 1024) {
    setRecognitionError('图片大小不能超过5MB');
    setRecognitionStatus('error');
    return;
  }

  setRecognitionStatus('uploading');
  setRecognitionError(null);

  // 创建预览URL
  const previewUrl = URL.createObjectURL(file);
  
  // 更新预览和状态
  setAnalysisChartData(prev => ({
    ...prev,
    recognition: {
      ...prev.recognition,
      imagePreview: previewUrl,
      recognitionResult: null,
      adviceText: '正在识别鱼类...'
    }
  }));

  try {
    const formData = new FormData();
    formData.append('image', file);

    // 直接调用 Go 后端 API
    const response = await fetch('http://localhost:8080/api/fish-recognition', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '识别失败');
    }

    const result = await response.json();
    
    setRecognitionStatus('success');
    setAnalysisChartData(prev => ({
      ...prev,
      recognition: {
        ...prev.recognition,
        recognitionResult: {
          name: result.name,
          score: result.score,
          description: result.description
        },
        adviceText: `识别成功: ${result.name} (置信度: ${(result.score * 100).toFixed(1)}%)`
      }
    }));
  } catch (error: any) {
    setRecognitionStatus('error');
    setRecognitionError(error.message || '识别失败，请重试');
    setAnalysisChartData(prev => ({
      ...prev,
      recognition: {
        ...prev.recognition,
        adviceText: '识别失败: ' + (error.message || '请重试')
      }
    }));
  }
};

  // 触发文件选择
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

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
            {/* 新增鱼类识别卡片 */}
            <AnalysisCard
              title="鱼类识别"
              icon={<FaFish className="w-6 h-6 text-teal-500" />}
              description="上传图片识别鱼类品种"
              status="待识别"
              confidence={0}
              onClick={() => handleAnalysisCardClick('recognition')}
              isSelected={selectedAnalysis === 'recognition'}
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
              
              {/* 鱼类识别区域 */}
              {selectedAnalysis === 'recognition' && (
                <div className="mb-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* 图片上传和预览区域 */}
                    <div className="w-full md:w-1/2">
                      <div 
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                          ${recognitionStatus === 'idle' 
                            ? 'border-gray-300 hover:border-blue-400 bg-gray-50' 
                            : recognitionStatus === 'uploading' 
                              ? 'border-yellow-400 bg-yellow-50' 
                              : recognitionStatus === 'success' 
                                ? 'border-green-400 bg-green-50' 
                                : 'border-red-400 bg-red-50'}`}
                        onClick={triggerFileInput}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        
                        {currentChartInfo.imagePreview ? (
                          <>
                            <img 
                              src={currentChartInfo.imagePreview} 
                              alt="鱼类图片预览" 
                              className="max-h-64 mx-auto mb-4 rounded-lg object-contain"
                            />
                            <p className="text-gray-600">
                              {recognitionStatus === 'uploading' 
                                ? '正在识别中...' 
                                : recognitionStatus === 'success' 
                                  ? '点击更换图片' 
                                  : '点击重新上传'}
                            </p>
                          </>
                        ) : (
                          <>
                            <FaUpload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600 mb-2">点击或拖拽图片到此处上传</p>
                            <p className="text-sm text-gray-500">支持 JPG, PNG 格式，最大 5MB</p>
                          </>
                        )}
                      </div>
                      
                      {recognitionError && (
                        <div className="mt-3 text-red-500 text-sm text-center">{recognitionError}</div>
                      )}
                    </div>
                    
                    {/* 识别结果展示区域 */}
                    <div className="w-full md:w-1/2">
                      {currentChartInfo.recognitionResult ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                          <div className="flex items-center mb-4">
                            <FaCheck className="w-6 h-6 text-green-500 mr-2" />
                            <h3 className="text-xl font-semibold text-gray-800">识别结果</h3>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">鱼类名称</h4>
                              <p className="text-lg font-semibold text-gray-800">{currentChartInfo.recognitionResult.name}</p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">置信度</h4>
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${currentChartInfo.recognitionResult.score * 100}%` }}
                                ></div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {Math.round(currentChartInfo.recognitionResult.score * 100)}%
                              </p>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium text-gray-500">鱼类描述</h4>
                              <p className="text-gray-700">{currentChartInfo.recognitionResult.description}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center h-full flex items-center justify-center">
                          <div>
                            <FaFish className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                            <p className="text-gray-600">
                              {recognitionStatus === 'uploading' 
                                ? '正在识别鱼类品种...' 
                                : '上传图片后，系统将自动识别鱼类品种'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* 图表展示区域（非识别页面） */}
              {selectedAnalysis !== 'recognition' && (
                <div className="h-[400px] md:h-[500px] mb-6">
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
              )}
              
              {/* 文字建议区 */}
              <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center">
                  <FaLightbulb className="w-5 h-5 mr-2 text-blue-600" />
                  {selectedAnalysis === 'recognition' ? '识别说明' : '图表解读与建议'}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {currentChartInfo.adviceText}
                </p>
              </div>
            </div>
          )}
          {/* AI 对话 */}
          <div className="mb-10">
          <AgentChatWindow />
          </div>

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
        <span className={`text-xs px-2 py-1 rounded-full ${status === '已完成' ? 'bg-green-100 text-green-700' : status === '待识别' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{status}</span>
        <span className="text-sm font-medium text-blue-600">{confidence ? `${confidence}% 置信度` : '等待上传'}</span>
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
