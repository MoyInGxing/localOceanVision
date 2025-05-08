"use client"
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import Image from 'next/image';
import Link from 'next/link';
import { FaChartLine, FaWater, FaBrain, FaDatabase } from 'react-icons/fa';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/dashboard');
    }
  }, [isLoggedIn, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-8">
              智慧海洋牧场可视化系统
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              打造智能化海洋养殖管理平台，实现水产养殖的数字化转型
            </p>
            <div className="flex justify-center">
              <Link 
                href="/login"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                立即登录
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            系统功能
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FaChartLine className="w-8 h-8 text-blue-600" />}
              title="主要信息"
              description="实时监控养殖环境参数，掌握关键数据指标"
            />
            <FeatureCard
              icon={<FaWater className="w-8 h-8 text-blue-600" />}
              title="水下系统"
              description="水质监测、设备控制、饲料投放自动化管理"
            />
            <FeatureCard
              icon={<FaBrain className="w-8 h-8 text-blue-600" />}
              title="智能中心"
              description="AI 辅助决策，优化养殖策略和资源配置"
            />
            <FeatureCard
              icon={<FaDatabase className="w-8 h-8 text-blue-600" />}
              title="数据中心"
              description="历史数据分析，预测趋势，提供决策支持"
            />
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <StatCard number="98%" text="系统稳定性" />
            <StatCard number="24/7" text="实时监控" />
            <StatCard number="50+" text="合作伙伴" />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StatCard({ number, text }: { number: string; text: string }) {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="text-4xl font-bold text-blue-600 mb-2">{number}</div>
      <div className="text-gray-600">{text}</div>
    </div>
  );
}
