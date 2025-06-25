'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaWater, FaFish, FaChartBar, FaMapMarkedAlt, FaDatabase, FaCloudUploadAlt, FaArrowRight } from 'react-icons/fa';

// 定义统计数据类型
interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

// 定义功能模块类型
interface FeatureModule {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  color: string;
  features: string[];
}

export default function DataCenter() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([]);

  // 模拟获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockStats: StatCard[] = [
          {
            title: '监测站点',
            value: '156',
            change: '+12',
            icon: <FaMapMarkedAlt className="text-2xl" />,
            color: 'bg-blue-500'
          },
          {
            title: '物种数据',
            value: '2,847',
            change: '+89',
            icon: <FaFish className="text-2xl" />,
            color: 'bg-green-500'
          },
          {
            title: '水质记录',
            value: '45,231',
            change: '+1,205',
            icon: <FaWater className="text-2xl" />,
            color: 'bg-cyan-500'
          },
          {
            title: '数据总量',
            value: '1.2TB',
            change: '+156GB',
            icon: <FaDatabase className="text-2xl" />,
            color: 'bg-purple-500'
          }
        ];
        
        setStats(mockStats);
      } catch (error) {
        console.error('获取统计数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // 功能模块配置
  const featureModules: FeatureModule[] = [
    {
      title: '水质监测中心',
      description: '实时监测水质状况，查看历史趋势，管理监测站点',
      icon: <FaWater className="text-4xl" />,
      link: '/water-monitoring',
      color: 'from-blue-500 to-cyan-500',
      features: [
        '实时水质监测',
        '历史数据分析',
        '地图可视化',
        '报警系统',
        '流域管理'
      ]
    },
    {
      title: '物种数据分析',
      description: '分析海洋物种数据，预测生长趋势，管理物种信息',
      icon: <FaFish className="text-4xl" />,
      link: '/species-analysis',
      color: 'from-green-500 to-emerald-500',
      features: [
        '物种数据管理',
        '体长体重分析',
        '生长预测模型',
        '数据上传导出',
        '统计图表'
      ]
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载数据中心...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">海洋数据中心</h1>
            <p className="text-xl text-gray-600">统一管理和分析海洋环境与生物数据</p>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-green-600 mt-1">
                      <span className="font-medium">{stat.change}</span> 本月新增
                    </p>
                  </div>
                  <div className={`${stat.color} text-white p-3 rounded-lg`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 功能模块 */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">核心功能模块</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {featureModules.map((module, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className={`bg-gradient-to-r ${module.color} p-6 text-white`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        {module.icon}
                        <h3 className="text-2xl font-bold">{module.title}</h3>
                      </div>
                      <FaArrowRight className="text-xl opacity-70" />
                    </div>
                    <p className="text-lg opacity-90">{module.description}</p>
                  </div>
                  
                  <div className="p-6">
                    <h4 className="font-semibold text-gray-900 mb-3">主要功能：</h4>
                    <ul className="space-y-2 mb-6">
                      {module.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-600">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Link 
                      href={module.link}
                      className="inline-flex items-center justify-center w-full px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      进入模块
                      <FaArrowRight className="ml-2" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 快速操作 */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">快速操作</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link 
                href="/water-monitoring"
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
              >
                <FaWater className="text-2xl text-blue-500 mr-4 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-semibold text-gray-900">查看水质监测</h3>
                  <p className="text-sm text-gray-600">实时水质数据和趋势</p>
                </div>
              </Link>
              
              <Link 
                href="/species-analysis"
                className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all group"
              >
                <FaFish className="text-2xl text-green-500 mr-4 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-semibold text-gray-900">物种数据分析</h3>
                  <p className="text-sm text-gray-600">查看和分析物种信息</p>
                </div>
              </Link>
              
              <div className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all group cursor-pointer">
                <FaCloudUploadAlt className="text-2xl text-purple-500 mr-4 group-hover:scale-110 transition-transform" />
                <div>
                  <h3 className="font-semibold text-gray-900">数据上传</h3>
                  <p className="text-sm text-gray-600">上传新的监测数据</p>
                </div>
              </div>
            </div>
          </div>

          {/* 系统状态 */}
          <div className="mt-12 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">系统状态</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-4 h-4 bg-green-400 rounded-full mx-auto mb-2"></div>
                <h3 className="font-semibold">数据库连接</h3>
                <p className="text-sm opacity-80">正常运行</p>
              </div>
              <div className="text-center">
                <div className="w-4 h-4 bg-green-400 rounded-full mx-auto mb-2"></div>
                <h3 className="font-semibold">API服务</h3>
                <p className="text-sm opacity-80">响应正常</p>
              </div>
              <div className="text-center">
                <div className="w-4 h-4 bg-yellow-400 rounded-full mx-auto mb-2"></div>
                <h3 className="font-semibold">数据同步</h3>
                <p className="text-sm opacity-80">部分延迟</p>
              </div>
            </div>
          </div>

          {/* 最近更新 */}
          <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">最近更新</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">长江流域水质监测数据更新</span>
                </div>
                <span className="text-sm text-gray-500">2小时前</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">新增物种数据 89 条</span>
                </div>
                <span className="text-sm text-gray-500">4小时前</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-700">系统性能优化完成</span>
                </div>
                <span className="text-sm text-gray-500">1天前</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}