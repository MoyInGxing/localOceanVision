'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { isLoggedIn, isAdmin, isLoading } = useAuth();
    const router = useRouter();

    console.log("ProtectedRoute: 组件渲染", { isLoggedIn, isAdmin, requireAdmin, isLoading });

    useEffect(() => {
        console.log("ProtectedRoute: 检查认证状态", { isLoggedIn, isAdmin, requireAdmin, isLoading });
        if (isLoading) {
            console.log("ProtectedRoute: 正在加载认证状态");
            return;
        }
        
        if (!isLoggedIn) {
            console.log("ProtectedRoute: 用户未登录，重定向到登录页面");
            router.push('/login');
        } else if (requireAdmin && !isAdmin) {
            console.log("ProtectedRoute: 用户不是管理员，重定向到仪表板");
            router.push('/dashboard');
        }
    }, [isLoggedIn, isAdmin, requireAdmin, router, isLoading]);

    if (isLoading) {
        console.log("ProtectedRoute: 正在加载中...");
        return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
    }

    if (!isLoggedIn || (requireAdmin && !isAdmin)) {
        console.log("ProtectedRoute: 返回null，等待重定向");
        return null;
    }

    console.log("ProtectedRoute: 渲染子组件");
    return <>{children}</>;
} 