'use client';

import { useState, useEffect } from 'react';
import { 
  FaMapMarkerAlt, 
  FaThermometerHalf, 
  FaFlask, 
  FaWater, 
  FaEye, 
  FaFilter, 
  FaSearch, 
  FaChartLine,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaDownload,
  FaSyncAlt,
  FaMapMarkedAlt,
  FaTachometerAlt
} from 'react-icons/fa';
import WaterQualityChart from '../components/WaterQualityChart';

// 定义水质状态类型
type WaterQualityStatus = 'normal' | 'warning' | 'error';

// 定义水质监测点类型
interface MonitoringPoint {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number];
  basin: string;
  temperature: number;
  ph: number;
  oxygen: number;
  turbidity: number;
  status: WaterQualityStatus;
  lastUpdate: Date;
}

// 定义流域类型
interface Basin {
  id: string;
  name: string;
  pointCount: number;
}

export default function MonitoringPoints() {
  const [monitoringPoints, setMonitoringPoints] = useState<MonitoringPoint[]>([]);
  const [filteredPoints, setFilteredPoints] = useState<MonitoringPoint[]>([]);
  const [selectedBasin, setSelectedBasin] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [basins, setBasins] = useState<Basin[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 历史数据图表状态
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<MonitoringPoint | null>(null);

  // 获取水质状态
  const getStatus = (temperature: number, ph: number, oxygen: number, turbidity: number): WaterQualityStatus => {
    // 设置更合理的阈值
    if (isNaN(temperature) || isNaN(ph) || isNaN(oxygen) || isNaN(turbidity)) {
      return "warning";
    }
    
    // 异常状态阈值 - 更严格的条件
    if (temperature > 32 || temperature < 10 || 
        ph > 9.5 || ph < 5.5 || 
        oxygen < 2 || 
        turbidity > 95) {
      return "error";
    }
    
    // 警告状态阈值 - 更严格的条件
    if (temperature > 30 || temperature < 12 || 
        ph > 9.0 || ph < 6.0 || 
        oxygen < 3 || 
        turbidity > 85) {
      return "warning";
    }
    
    return "normal";
  };

  // 生成模拟监测点数据（已注释作为备用方案）
  /*
  const generateMonitoringPoints = (): MonitoringPoint[] => {
    const basinNames = [
      '长江流域', '黄河流域', '珠江流域', '淮河流域', 
      '海河流域', '辽河流域', '松花江流域', '太湖流域'
    ];
    
    const cities = [
      '上海市', '北京市', '广州市', '深圳市', '杭州市', 
      '南京市', '武汉市', '成都市', '西安市', '青岛市',
      '大连市', '厦门市', '宁波市', '苏州市', '天津市'
    ];

    const points: MonitoringPoint[] = [];
    
    for (let i = 1; i <= 50; i++) {
      const basin = basinNames[Math.floor(Math.random() * basinNames.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const temperature = 15 + Math.random() * 20; // 15-35°C
      const ph = 6.0 + Math.random() * 3.0; // 6.0-9.0
      const oxygen = 2 + Math.random() * 8; // 2-10mg/L
      const turbidity = 10 + Math.random() * 90; // 10-100NTU
      
      points.push({
        id: `point_${i}`,
        name: `${city}监测点${i}`,
        location: `${city}${basin}`,
        coordinates: [116.4 + (Math.random() - 0.5) * 20, 39.9 + (Math.random() - 0.5) * 15],
        basin,
        temperature,
        ph,
        oxygen,
        turbidity,
        status: getStatus(temperature, ph, oxygen, turbidity),
        lastUpdate: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // 最近24小时内
      });
    }
    
    return points;
  };
  */
  
  // 根据area_id映射流域名称
  const getBasinByAreaId = (areaId: string): string => {
    // 根据area_id的前缀或规则映射到具体流域
    const areaCode = areaId.toString();
    
    // 示例映射规则（可根据实际情况调整）
    if (areaCode.startsWith('1602')) return '长江流域';
    if (areaCode.startsWith('1603')) return '黄河流域';
    if (areaCode.startsWith('1604')) return '珠江流域';
    if (areaCode.startsWith('1605')) return '淮河流域';
    if (areaCode.startsWith('1606')) return '海河流域';
    if (areaCode.startsWith('1607')) return '辽河流域';
    if (areaCode.startsWith('1608')) return '松花江流域';
    if (areaCode.startsWith('1609')) return '太湖流域';
    
    return '其他流域';
  };

  // 根据area_id获取地理位置名称
  const getLocationByAreaId = (areaId: string): string => {
    // 可以根据area_id映射到具体的地理位置
    const areaCode = areaId.toString();
    
    // 示例映射（可根据实际区域编码规则调整）
    if (areaCode === '160207') return '内蒙古呼伦贝尔';
    if (areaCode.startsWith('1602')) return '内蒙古自治区';
    if (areaCode.startsWith('1603')) return '山西省';
    if (areaCode.startsWith('1604')) return '广东省';
    
    return `区域${areaId}`;
  };

  // 从API获取监测点数据
  const fetchMonitoringPoints = async (): Promise<MonitoringPoint[]> => {
    try {
      // 实际API调用
      const response = await fetch('http://localhost:8082/api/monitoring-points');
      if (!response.ok) {
        throw new Error('获取监测点数据失败');
      }
      const data = await response.json();
      
      // 处理API响应数据，将其转换为前端需要的格式
      const points: MonitoringPoint[] = [];
      
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.area_id) {
            const basin = getBasinByAreaId(item.area_id);
            const location = getLocationByAreaId(item.area_id);
            
            const point: MonitoringPoint = {
              id: item.area_id,
              name: `${location}监测站`,
              location: location,
              coordinates: [116.4 + (Math.random() - 0.5) * 20, 39.9 + (Math.random() - 0.5) * 15], // 临时坐标
              basin: basin,
              temperature: item.temperature || 0,
              ph: item.ph_value || 7,
              oxygen: item.dissolved_oxygen || 0,
              turbidity: item.turbidity || 0,
              status: item.station_status === '正常' ? 
                     getStatus(item.temperature || 0, item.ph_value || 7, item.dissolved_oxygen || 0, item.turbidity || 0) : 
                     (item.station_status === '警告' ? 'warning' as WaterQualityStatus : 'error' as WaterQualityStatus),
              lastUpdate: item.record_time ? new Date(item.record_time) : new Date()
            };
            points.push(point);
          }
        });
      }
      
      return points;
    } catch (error) {
      console.error('获取监测点数据失败:', error);
      return [];
    }
  };

  // 生成流域统计数据
  const generateBasinStats = (points: MonitoringPoint[]): Basin[] => {
    const basinMap = new Map<string, number>();
    
    points.forEach(point => {
      basinMap.set(point.basin, (basinMap.get(point.basin) || 0) + 1);
    });
    
    return Array.from(basinMap.entries()).map(([name, count]) => ({
      id: name.replace(/流域$/, ''),
      name,
      pointCount: count
    }));
  };

  // 生成示例数据用于展示
  const generateDemoData = (): MonitoringPoint[] => {
    const demoPoints: MonitoringPoint[] = [
      {
        id: 'demo_001',
        name: '长江口监测站',
        location: '上海市崇明区',
        coordinates: [121.4, 31.2],
        basin: '长江流域',
        temperature: 18.5,
        ph: 7.2,
        oxygen: 8.3,
        turbidity: 15.2,
        status: 'normal' as WaterQualityStatus,
        lastUpdate: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 'demo_002',
        name: '黄河入海口监测站',
        location: '山东省东营市',
        coordinates: [118.7, 37.8],
        basin: '黄河流域',
        temperature: 22.1,
        ph: 8.1,
        oxygen: 6.8,
        turbidity: 45.3,
        status: 'warning' as WaterQualityStatus,
        lastUpdate: new Date(Date.now() - 15 * 60 * 1000)
      },
      {
        id: 'demo_003',
        name: '珠江口监测站',
        location: '广东省珠海市',
        coordinates: [113.6, 22.3],
        basin: '珠江流域',
        temperature: 26.8,
        ph: 6.8,
        oxygen: 5.2,
        turbidity: 78.9,
        status: 'error' as WaterQualityStatus,
        lastUpdate: new Date(Date.now() - 45 * 60 * 1000)
      },
      {
        id: 'demo_004',
        name: '淮河中游监测站',
        location: '安徽省蚌埠市',
        coordinates: [117.4, 32.9],
        basin: '淮河流域',
        temperature: 19.3,
        ph: 7.5,
        oxygen: 7.9,
        turbidity: 22.1,
        status: 'normal' as WaterQualityStatus,
        lastUpdate: new Date(Date.now() - 20 * 60 * 1000)
      },
      {
        id: 'demo_005',
        name: '海河天津段监测站',
        location: '天津市河西区',
        coordinates: [117.2, 39.1],
        basin: '海河流域',
        temperature: 16.7,
        ph: 7.8,
        oxygen: 6.5,
        turbidity: 35.6,
        status: 'warning' as WaterQualityStatus,
        lastUpdate: new Date(Date.now() - 10 * 60 * 1000)
      },
      {
        id: 'demo_006',
        name: '辽河沈阳段监测站',
        location: '辽宁省沈阳市',
        coordinates: [123.4, 41.8],
        basin: '辽河流域',
        temperature: 14.2,
        ph: 7.1,
        oxygen: 8.7,
        turbidity: 18.4,
        status: 'normal' as WaterQualityStatus,
        lastUpdate: new Date(Date.now() - 25 * 60 * 1000)
      }
    ];
    return demoPoints;
  };

  // 初始化数据
  useEffect(() => {
    const loadData = async () => {
      try {
        const points = await fetchMonitoringPoints();
        
        // 如果API返回空数据，使用示例数据
        const finalPoints = points.length > 0 ? points : generateDemoData();
        const basinStats = generateBasinStats(finalPoints);
        
        setMonitoringPoints(finalPoints);
        setFilteredPoints(finalPoints);
        setBasins(basinStats);
      } catch (error) {
        console.error('加载监测点数据失败:', error);
        // 使用示例数据作为后备
        const demoPoints = generateDemoData();
        const basinStats = generateBasinStats(demoPoints);
        setMonitoringPoints(demoPoints);
        setFilteredPoints(demoPoints);
        setBasins(basinStats);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 筛选监测点
  useEffect(() => {
    let filtered = monitoringPoints;
    
    // 按流域筛选
    if (selectedBasin !== 'all') {
      filtered = filtered.filter(point => point.basin === selectedBasin);
    }
    
    // 按状态筛选
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(point => point.status === selectedStatus);
    }
    
    // 按搜索词筛选
    if (searchTerm) {
      filtered = filtered.filter(point => 
        point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        point.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPoints(filtered);
  }, [monitoringPoints, selectedBasin, selectedStatus, searchTerm]);

  // 获取状态样式
  const getStatusStyle = (status: WaterQualityStatus) => {
    switch (status) {
      case 'normal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // 获取状态文本
  const getStatusText = (status: WaterQualityStatus) => {
    switch (status) {
      case 'normal':
        return '正常';
      case 'warning':
        return '警告';
      case 'error':
        return '异常';
      default:
        return '未知';
    }
  };

  // 处理查看历史数据
  const handleViewHistory = (point: MonitoringPoint) => {
    setSelectedPoint(point);
    setChartOpen(true);
  };

  // 关闭历史数据图表
  const handleCloseChart = () => {
    setChartOpen(false);
    setSelectedPoint(null);
  };

  // 统计数据
  const totalPoints = monitoringPoints.length;
  const normalPoints = monitoringPoints.filter(p => p.status === 'normal').length;
  const warningPoints = monitoringPoints.filter(p => p.status === 'warning').length;
  const errorPoints = monitoringPoints.filter(p => p.status === 'error').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载监测点数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 页面标题 */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">流域监测点管理</h1>
                <p className="mt-2 text-blue-100">实时监控各流域水质监测点状态</p>
              </div>
              <div className="flex space-x-4">
                <button className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-md text-white hover:bg-opacity-30 transition-all">
                  <FaPlus className="mr-2" />
                  <span>添加监测点</span>
                </button>
                <button className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-md text-white hover:bg-opacity-30 transition-all">
                  <FaDownload className="mr-2" />
                  <span>导出数据</span>
                </button>
                <button className="flex items-center px-4 py-2 bg-white bg-opacity-20 rounded-md text-white hover:bg-opacity-30 transition-all">
                  <FaSyncAlt className="mr-2" />
                  <span>刷新</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
                <FaMapMarkedAlt className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总监测点</p>
                <div className="flex items-baseline">
                  <p className="text-3xl font-bold text-gray-900">{totalPoints}</p>
                  <p className="ml-2 text-sm text-gray-500">个</p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
                <FaCheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">正常</p>
                <div className="flex items-baseline">
                  <p className="text-3xl font-bold text-green-600">{normalPoints}</p>
                  <p className="ml-2 text-sm text-gray-500">个</p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${totalPoints ? (normalPoints / totalPoints * 100) : 0}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 p-3 rounded-lg">
                <FaExclamationTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">警告</p>
                <div className="flex items-baseline">
                  <p className="text-3xl font-bold text-yellow-600">{warningPoints}</p>
                  <p className="ml-2 text-sm text-gray-500">个</p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${totalPoints ? (warningPoints / totalPoints * 100) : 0}%` }}></div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-500 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-100 p-3 rounded-lg">
                <FaTimesCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">异常</p>
                <div className="flex items-baseline">
                  <p className="text-3xl font-bold text-red-600">{errorPoints}</p>
                  <p className="ml-2 text-sm text-gray-500">个</p>
                </div>
              </div>
            </div>
            <div className="mt-4 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full" style={{ width: `${totalPoints ? (errorPoints / totalPoints * 100) : 0}%` }}></div>
            </div>
          </div>
        </div>

        {/* 筛选和搜索 */}
        <div className="bg-white rounded-xl shadow-md mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaTachometerAlt className="mr-2 text-blue-600" />
                监测点筛选
              </h3>
              <div className="text-sm text-gray-500">
                共找到 <span className="font-semibold text-blue-600">{filteredPoints.length}</span> 个监测点
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 搜索框 */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="搜索监测点..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
              
              {/* 流域筛选 */}
              <div>
                <select
                  value={selectedBasin}
                  onChange={(e) => setSelectedBasin(e.target.value)}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="all">所有流域</option>
                  {basins.map(basin => (
                    <option key={basin.id} value={basin.name}>
                      {basin.name} ({basin.pointCount}个点)
                    </option>
                  ))}
                </select>
              </div>
              
              {/* 状态筛选 */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="block w-full px-3 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="all">所有状态</option>
                  <option value="normal">正常</option>
                  <option value="warning">警告</option>
                  <option value="error">异常</option>
                </select>
              </div>
              
              {/* 清除筛选 */}
              <div>
                <button
                  onClick={() => {
                    setSelectedBasin('all');
                    setSelectedStatus('all');
                    setSearchTerm('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all flex items-center justify-center"
                >
                  <FaFilter className="mr-2" />
                  清除筛选
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 监测点列表 */}
        <div className="bg-white rounded-xl shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-blue-600" />
                监测点列表
              </h3>
              <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                {filteredPoints.length} 个监测点
              </span>
            </div>
          </div>
          
          {filteredPoints.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FaMapMarkerAlt className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无监测点数据</h3>
              <p className="text-gray-500 mb-6">当前没有找到符合条件的监测点，请尝试调整筛选条件或添加新的监测点</p>
              <div className="flex justify-center space-x-4">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <FaPlus className="mr-2" />
                  添加监测点
                </button>
                <button 
                  onClick={() => {
                    setSelectedBasin('all');
                    setSelectedStatus('all');
                    setSearchTerm('');
                  }}
                  className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FaSyncAlt className="mr-2" />
                  重置筛选
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      监测点信息
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      流域
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      水质参数
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      最后更新
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPoints.map((point, index) => (
                    <tr key={point.id} className={`hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaMapMarkerAlt className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">{point.name}</div>
                            <div className="text-sm text-gray-500">{point.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                          {point.basin}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center bg-red-50 px-2 py-1 rounded">
                            <FaThermometerHalf className="h-3 w-3 text-red-500 mr-1" />
                            <span className="font-medium">{point.temperature.toFixed(1)}°C</span>
                          </div>
                          <div className="flex items-center bg-purple-50 px-2 py-1 rounded">
                            <FaFlask className="h-3 w-3 text-purple-500 mr-1" />
                            <span className="font-medium">pH {point.ph.toFixed(1)}</span>
                          </div>
                          <div className="flex items-center bg-blue-50 px-2 py-1 rounded">
                            <FaWater className="h-3 w-3 text-blue-500 mr-1" />
                            <span className="font-medium">{point.oxygen.toFixed(1)}mg/L</span>
                          </div>
                          <div className="flex items-center bg-gray-50 px-2 py-1 rounded">
                            <FaEye className="h-3 w-3 text-gray-500 mr-1" />
                            <span className="font-medium">{point.turbidity.toFixed(1)}NTU</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusStyle(point.status)}`}>
                          {point.status === 'normal' && <FaCheckCircle className="mr-1 h-3 w-3" />}
                          {point.status === 'warning' && <FaExclamationTriangle className="mr-1 h-3 w-3" />}
                          {point.status === 'error' && <FaTimesCircle className="mr-1 h-3 w-3" />}
                          {getStatusText(point.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {point.lastUpdate.toLocaleString('zh-CN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <span className="text-xs text-gray-400">
                            {Math.floor((Date.now() - point.lastUpdate.getTime()) / (1000 * 60))} 分钟前
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button className="flex items-center px-3 py-1 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded transition-all">
                            <FaEye className="mr-1 h-3 w-3" />
                            <span>详情</span>
                          </button>
                          <button 
                            onClick={() => handleViewHistory(point)}
                            className="flex items-center px-3 py-1 text-green-600 hover:text-green-900 hover:bg-green-50 rounded transition-all"
                          >
                            <FaChartLine className="mr-1 h-3 w-3" />
                            <span>历史</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* 历史数据图表弹窗 */}
      {selectedPoint && (
        <WaterQualityChart
          areaId={selectedPoint.id}
          areaName={selectedPoint.name}
          isOpen={chartOpen}
          onClose={handleCloseChart}
        />
      )}
    </div>
  );
}