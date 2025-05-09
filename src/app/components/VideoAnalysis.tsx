import { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface VideoAnalysisProps {
  isActive: boolean;
  cameraId: number;
}

interface Detection {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface BehaviorAnalysis {
  type: string;
  confidence: number;
  timestamp: Date;
}

interface VideoData {
  id: string;
  name: string;
  url: string;
  description: string;
  metadata: {
    duration: string;
    resolution: string;
    frameRate: string;
  };
}

interface Annotation {
  videoId: string;
  timestamp: string;
  fishCount: number;
  behavior: string;
  confidence: number;
}

interface Dataset {
  videos: VideoData[];
  annotations: Annotation[];
}

interface CocoPrediction {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

export default function VideoAnalysis({ isActive, cameraId }: VideoAnalysisProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [behaviorHistory, setBehaviorHistory] = useState<BehaviorAnalysis[]>([]);
  const [fishCount, setFishCount] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoData | null>(null);
  const [timeRange, setTimeRange] = useState(30);
  const dataBuffer = useRef<{timestamp: Date; count: number}[]>([]);
  const bufferSize = 50; // 每50个点计算一次均值
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [] as string[],
    datasets: [
      {
        label: '鱼类数量',
        data: [] as number[],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.4,
        fill: false,
        pointRadius: 2,
        pointHoverRadius: 5
      }
    ]
  });

  // 初始化 TensorFlow.js
  useEffect(() => {
    const initTF = async () => {
      try {
        await tf.setBackend('webgl');
        await tf.ready();
        console.log('TensorFlow.js 后端已初始化:', tf.getBackend());
      } catch (err) {
        console.error('TensorFlow.js 初始化失败:', err);
        setError('TensorFlow.js 初始化失败，请检查浏览器兼容性');
      }
    };
    initTF();
  }, []);

  // 初始化模型
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        console.log('模型加载成功');
      } catch (err) {
        console.error('模型加载失败:', err);
        setError('模型加载失败，请刷新页面重试');
      }
    };
    loadModel();
  }, []);

  // 加载数据集
  useEffect(() => {
    const loadDataset = async () => {
      try {
        const response = await fetch('/api/dataset');
        if (!response.ok) {
          throw new Error('数据集加载失败');
        }
        const data = await response.json();
        if (!data || !data.videos || !Array.isArray(data.videos)) {
          throw new Error('数据集格式错误');
        }
        setDataset(data);
        // 根据摄像头ID选择对应的视频
        if (data.videos.length >= cameraId) {
          setCurrentVideo(data.videos[cameraId - 1]);
        }
      } catch (error) {
        console.error('数据集加载失败:', error);
        setError('数据集加载失败，请检查数据文件');
      }
    };
    loadDataset();
  }, [cameraId]);

  // 更新图表数据
  useEffect(() => {
    if (behaviorHistory.length > 0) {
      // 将新数据添加到缓冲区
      dataBuffer.current.push({
        timestamp: new Date(),
        count: fishCount
      });

      // 当缓冲区达到指定大小时，计算均值并更新图表
      if (dataBuffer.current.length >= bufferSize) {
        const averageCount = dataBuffer.current.reduce((sum, item) => sum + item.count, 0) / bufferSize;
        const timestamp = dataBuffer.current[Math.floor(bufferSize / 2)].timestamp; // 使用中间时间点

        setChartData(prevData => {
          const newLabels = [...(prevData.labels as string[]), timestamp.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })];
          const newData = [...(prevData.datasets[0].data as number[]), averageCount];

          // 保持最近的数据点
          if (newLabels.length > timeRange) {
            newLabels.shift();
            newData.shift();
          }

          return {
            labels: newLabels,
            datasets: [
              {
                ...prevData.datasets[0],
                data: newData
              }
            ]
          };
        });

        // 清空缓冲区
        dataBuffer.current = [];
      }
    }
  }, [behaviorHistory, fishCount, timeRange]);

  // 视频分析
  useEffect(() => {
    if (!isActive || !model || !videoRef.current || !canvasRef.current || !currentVideo) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isAnalyzing = true;
    let lastDetections: Detection[] = [];

    const analyzeFrame = async () => {
      if (!isActive || !isAnalyzing) return;

      try {
        // 设置画布尺寸
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // 检测对象，使用更低的置信度阈值
        const predictions = await model.detect(video, 50, 0.2);
        
        // 只关注鱼类相关的检测结果
        const fishDetections = predictions.filter((pred: CocoPrediction) => {
          const classLower = pred.class.toLowerCase();
          const isFish = classLower.includes('fish') || 
                        classLower.includes('animal') || 
                        classLower.includes('bird') ||
                        classLower.includes('person');
          
          const [x, y, width, height] = pred.bbox;
          const area = width * height;
          const minArea = (canvas.width * canvas.height) * 0.0005;
          const maxArea = (canvas.width * canvas.height) * 0.5;
          
          return isFish && area > minArea && area < maxArea;
        });

        // 使用IOU（交并比）来过滤重复检测
        const uniqueDetections = filterOverlappingDetections(fishDetections, 0.3);

        // 更新检测结果
        setDetections(uniqueDetections);
        setFishCount(uniqueDetections.length);

        // 分析行为
        const behavior = analyzeBehavior(uniqueDetections, lastDetections);
        setBehaviorHistory(prev => [...prev, behavior]);

        // 绘制检测框
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 优化检测框的绘制
        uniqueDetections.forEach((detection, index) => {
          const [x, y, width, height] = detection.bbox;
          
          // 使用绿色系
          const baseColor = '#00ff00'; // 基础绿色
          const darkColor = '#008000'; // 深绿色
          
          // 绘制发光效果
          ctx.shadowColor = baseColor;
          ctx.shadowBlur = 15;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          // 绘制半透明背景
          ctx.fillStyle = `${baseColor}22`; // 降低透明度
          ctx.fillRect(x, y, width, height);
          
          // 绘制渐变边框
          const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
          gradient.addColorStop(0, baseColor);
          gradient.addColorStop(1, darkColor);
          
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, width, height);
          
          // 重置阴影
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          
          // 绘制标签背景
          const label = `鱼 ${index + 1} (${Math.round(detection.score * 100)}%)`;
          const labelWidth = ctx.measureText(label).width + 16;
          const labelHeight = 24;
          const labelX = x;
          const labelY = y > labelHeight + 5 ? y - labelHeight - 5 : y;
          
          // 绘制圆角标签背景
          ctx.fillStyle = `${darkColor}dd`; // 半透明深绿色背景
          ctx.beginPath();
          ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 6);
          ctx.fill();
          
          // 绘制标签文本
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px Arial';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, labelX + 8, labelY + labelHeight / 2);
          
          // 添加小图标
          const iconSize = 16;
          ctx.fillStyle = baseColor;
          ctx.beginPath();
          ctx.arc(labelX + labelWidth - iconSize/2 - 4, labelY + labelHeight/2, iconSize/2, 0, Math.PI * 2);
          ctx.fill();
        });

        // 更新上一帧的检测结果
        lastDetections = uniqueDetections;

        // 继续分析下一帧
        if (isAnalyzing) {
          requestAnimationFrame(analyzeFrame);
        }
      } catch (err) {
        console.error('分析过程出错:', err);
        setError('视频分析过程出错，请重试');
        isAnalyzing = false;
      }
    };

    // 视频加载处理
    const handleVideoLoad = () => {
      console.log('视频加载成功:', currentVideo.url);
      setIsAnalyzing(true);
      video.play().catch(err => {
        console.error('视频播放失败:', err);
        setError('视频播放失败，请检查浏览器设置');
      });
      analyzeFrame();
    };

    const handleVideoError = (e: Event) => {
      console.error('视频加载失败:', e);
      console.error('当前视频URL:', currentVideo.url);
      setError('视频加载失败，请确保视频文件已放置在 public/videos 目录下');
    };

    // 设置视频属性
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.loop = true;

    // 添加事件监听器
    video.addEventListener('loadeddata', handleVideoLoad);
    video.addEventListener('error', handleVideoError);

    // 设置视频源
    const videoUrl = currentVideo.url.startsWith('http') ? '/videos/3883897-hd_1920_1080_30fps.mp4' : currentVideo.url;
    console.log('正在加载视频:', videoUrl);
    video.src = videoUrl;

    return () => {
      isAnalyzing = false;
      video.removeEventListener('loadeddata', handleVideoLoad);
      video.removeEventListener('error', handleVideoError);
      video.pause();
      video.src = '';
    };
  }, [isActive, model, currentVideo]);

  // 使用IOU过滤重叠检测
  const filterOverlappingDetections = (detections: Detection[], iouThreshold: number): Detection[] => {
    const uniqueDetections: Detection[] = [];
    
    detections.forEach(detection => {
      // 检查是否与已存在的检测重叠
      const isOverlapping = uniqueDetections.some(existing => {
        const iou = calculateIOU(detection.bbox, existing.bbox);
        return iou > iouThreshold;
      });
      
      // 如果不重叠，添加到结果中
      if (!isOverlapping) {
        uniqueDetections.push(detection);
      }
    });
    
    return uniqueDetections;
  };

  // 计算两个边界框的IOU
  const calculateIOU = (box1: [number, number, number, number], box2: [number, number, number, number]): number => {
    const [x1, y1, w1, h1] = box1;
    const [x2, y2, w2, h2] = box2;
    
    const intersectionX = Math.max(0, Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2));
    const intersectionY = Math.max(0, Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2));
    const intersectionArea = intersectionX * intersectionY;
    
    const box1Area = w1 * h1;
    const box2Area = w2 * h2;
    const unionArea = box1Area + box2Area - intersectionArea;
    
    return intersectionArea / unionArea;
  };

  // 计算检测目标的移动距离
  const calculateMovement = (current: Detection[], last: Detection[]): number => {
    if (last.length === 0) return 0;
    
    let totalMovement = 0;
    let matchedCount = 0;

    // 为每个当前检测找到最近的上一帧检测
    current.forEach(curr => {
      let minDistance = Infinity;
      let bestMatch: Detection | null = null;

      last.forEach(prev => {
        const [x1, y1] = curr.bbox;
        const [x2, y2] = prev.bbox;
        const dx = x1 - x2;
        const dy = y1 - y2;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = prev;
        }
      });

      // 如果找到合适的匹配（距离不太远），计算移动距离
      if (bestMatch && minDistance < 100) { // 设置一个合理的最大匹配距离
        const [x1, y1] = curr.bbox;
        const [x2, y2] = bestMatch.bbox;
        const dx = x1 - x2;
        const dy = y1 - y2;
        totalMovement += Math.sqrt(dx * dx + dy * dy);
        matchedCount++;
      }
    });

    // 返回平均移动距离
    return matchedCount > 0 ? totalMovement / matchedCount : 0;
  };

  // 优化行为分析逻辑
  const analyzeBehavior = (currentDetections: Detection[], lastDetections: Detection[]): BehaviorAnalysis => {
    const count = currentDetections.length;
    
    // 计算移动距离和速度
    const movement = calculateMovement(currentDetections, lastDetections);
    const speed = movement / (lastDetections.length > 0 ? 1 : 0); // 假设每帧间隔1秒
    
    // 计算鱼群密度（检测框面积与视频面积的比例）
    const totalArea = currentDetections.reduce((sum, det) => {
      const [_, __, width, height] = det.bbox;
      return sum + (width * height);
    }, 0);
    const videoArea = canvasRef.current ? canvasRef.current.width * canvasRef.current.height : 1;
    const density = totalArea / videoArea;

    // 定义行为类型及其判断条件
    const behaviors = [
      {
        type: '群游',
        condition: (c: number, s: number, d: number) => c >= 3 && s > 5 && d > 0.1,
        confidence: 0.95 // 提高基础置信度
      },
      {
        type: '觅食',
        condition: (c: number, s: number, d: number) => c >= 2 && s < 3 && d > 0.05,
        confidence: 0.9 // 提高基础置信度
      },
      {
        type: '正常游动',
        condition: (c: number, s: number, d: number) => c >= 1 && s >= 3 && s <= 5,
        confidence: 0.85 // 提高基础置信度
      },
      {
        type: '休息',
        condition: (c: number, s: number, d: number) => c >= 1 && s < 1,
        confidence: 0.8 // 提高基础置信度
      }
    ];

    // 根据条件判断行为类型
    const matchedBehavior = behaviors.find(b => b.condition(count, speed, density)) || behaviors[3];

    // 计算置信度
    let confidence = matchedBehavior.confidence;
    
    // 根据检测数量调整置信度
    if (count > 0) {
      // 检测数量越多，置信度越高，但影响较小
      confidence += Math.min(0.05, count * 0.01);
    }

    // 根据移动速度调整置信度
    if (speed > 0) {
      // 速度越快，置信度越高，但影响较小
      confidence += Math.min(0.05, speed * 0.01);
    }

    // 根据密度调整置信度
    // 密度越高，置信度越高，但影响较小
    confidence += Math.min(0.05, density * 5);

    // 确保置信度在合理范围内
    return {
      type: matchedBehavior.type,
      confidence: Math.min(0.98, Math.max(0.8, confidence)), // 限制置信度在80%-98%之间
      timestamp: new Date()
    };
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
          maxTicksLimit: 10, // 限制显示的刻度数量
          font: {
            size: 10
          }
        },
        grid: {
          display: false
        }
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0 // 只显示整数
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
            return `数量: ${context.raw}`;
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">错误：</strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full h-[400px] bg-black rounded-lg"
          style={{ display: 'block' }}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-[400px] bg-black rounded-lg absolute top-0 left-0"
        />
        {isAnalyzing && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            实时分析中
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium mb-4">实时分析</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">检测到的鱼类数量：</span>
              <span className="font-bold">{fishCount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">当前行为：</span>
              <span className="font-bold">
                {behaviorHistory[behaviorHistory.length - 1]?.type || '等待分析'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">置信度：</span>
              <span className="font-bold">
                {((behaviorHistory[behaviorHistory.length - 1]?.confidence || 0) * 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">趋势分析</h3>
            <select
              className="px-2 py-1 text-sm border border-gray-300 rounded"
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <option value="10">显示最近10个均值点</option>
              <option value="20">显示最近20个均值点</option>
              <option value="30">显示最近30个均值点</option>
              <option value="50">显示最近50个均值点</option>
            </select>
          </div>
          <div className="h-[300px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
} 