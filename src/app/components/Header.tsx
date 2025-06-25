'use client';

import Link from "next/link";
import Image from "next/image";
import { IoMenu } from "react-icons/io5";
import { IoClose } from "react-icons/io5";
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isLoggedIn, logout, isAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        setIsMobileMenuOpen(false);
        router.push('/login');
    };

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-20">
                    <Link href="/" className="flex items-center">
                        <Image src="/img/logo.png" alt="Logo" width={40} height={40} className="rounded-lg" />
                        <span className="ml-2 text-xl font-bold text-gray-900">智慧海洋牧场</span>
                    </Link>

                    {/* 桌面端导航 */}
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 transition-colors">
                            主要信息
                        </Link>
                        <Link href="/underwater" className="text-gray-700 hover:text-blue-600 transition-colors">
                            水下系统
                        </Link>
                        <Link href="/intelligence" className="text-gray-700 hover:text-blue-600 transition-colors">
                            智能中心
                        </Link>
                        <Link href="/monitoring-points" className="text-gray-700 hover:text-blue-600 transition-colors">
                            监测点管理
                        </Link>
                        <Link href="/data-center" className="text-gray-700 hover:text-blue-600 transition-colors">
                            数据中心
                        </Link>
                        {isAdmin && (
                            <Link href="/admin" className="text-gray-700 hover:text-blue-600 transition-colors">
                                管理控制台
                            </Link>
                        )}
                    </nav>

                    {/* 桌面端用户操作 */}
                    <div className="hidden md:flex items-center space-x-4">
                        {!isLoggedIn ? (
                            <>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    登录
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    注册
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/profile"
                                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    个人中心
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-gray-700 hover:text-blue-600 transition-colors"
                                >
                                    退出
                                </button>
                            </>
                        )}
                    </div>

                    {/* 移动端菜单按钮 */}
                    <button
                        className="md:hidden text-gray-700"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    >
                        {isMobileMenuOpen ? <IoClose size={24} /> : <IoMenu size={24} />}
                    </button>
                </div>

                {/* 移动端导航菜单 */}
                {isMobileMenuOpen && (
                    <div className="md:hidden py-4">
                        <nav className="flex flex-col space-y-4">
                            <Link
                                href="/dashboard"
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                主要信息
                            </Link>
                            <Link
                                href="/underwater"
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                水下系统
                            </Link>
                            <Link
                                href="/intelligence"
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                智能中心
                            </Link>
                            <Link
                                href="/monitoring-points"
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                监测点管理
                            </Link>
                            <Link
                                href="/data-center"
                                className="text-gray-700 hover:text-blue-600 transition-colors"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                数据中心
                            </Link>
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className="text-gray-700 hover:text-blue-600 transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    管理控制台
                                </Link>
                            )}
                            {!isLoggedIn ? (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-gray-700 hover:text-blue-600 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        登录
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="text-gray-700 hover:text-blue-600 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        注册
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/profile"
                                        className="text-gray-700 hover:text-blue-600 transition-colors"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        个人中心
                                    </Link>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="text-left text-gray-700 hover:text-blue-600 transition-colors"
                                    >
                                        退出
                                    </button>
                                </>
                            )}
                        </nav>
                    </div>
                )}
            </div>
        </header>
    );
}