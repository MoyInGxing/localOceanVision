'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: string;
    username: string;
    role: string;
    email?: string;
    phone?: string;
}

interface AuthContextType {
    user: User | null;
    isLoggedIn: boolean;
    isAdmin: boolean;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, email: string, phone: string) => Promise<void>;
    logout: () => void;
    updateUser: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export { useAuth };

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        console.log("AuthProvider: 开始验证会话");
        const validateSession = async () => {
            try {
                const storedUser = localStorage.getItem('user');
                console.log("AuthProvider: 从localStorage获取用户信息", storedUser);
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    // 暂停会话验证 - 直接使用本地存储的用户信息
                    console.log("AuthProvider: 跳过会话验证，直接使用本地用户信息");
                    setUser(userData);
                    
                    // 原始验证逻辑已暂停
                    // const response = await fetch('/api/auth/validate', {
                    //     method: 'POST',
                    //     headers: {
                    //         'Content-Type': 'application/json',
                    //     },
                    //     body: JSON.stringify({ userId: userData.id }),
                    // });
                    //
                    // if (response.ok) {
                    //     console.log("AuthProvider: 会话验证成功，设置用户信息");
                    //     setUser(userData);
                    // } else {
                    //     console.log("AuthProvider: 会话验证失败，清除用户信息");
                    //     localStorage.removeItem('user');
                    //     setUser(null);
                    // }
                } else {
                    console.log("AuthProvider: 未找到存储的用户信息");
                    // 暂停验证期间，如果没有本地用户信息，设置默认管理员用户
                    const defaultUser = {
                        id: 'temp-admin',
                        username: 'temp-admin',
                        role: 'admin',
                        email: 'admin@temp.com'
                    };
                    console.log("AuthProvider: 设置临时管理员用户");
                    setUser(defaultUser);
                    localStorage.setItem('user', JSON.stringify(defaultUser));
                }
            } catch (error) {
                console.error('AuthProvider: 会话验证失败:', error);
                // 暂停验证期间，即使出错也设置默认用户
                const defaultUser = {
                    id: 'temp-admin',
                    username: 'temp-admin', 
                    role: 'admin',
                    email: 'admin@temp.com'
                };
                setUser(defaultUser);
                localStorage.setItem('user', JSON.stringify(defaultUser));
            } finally {
                setIsLoading(false);
                console.log("AuthProvider: 会话验证完成", { user, isLoading });
            }
        };

        validateSession();
    }, []);

    const login = async (username: string, password: string) => {
        try {
            console.log("AuthProvider: 开始登录");
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '登录失败');
            }

            const data = await response.json();
            console.log("AuthProvider: 登录成功，设置用户信息");
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('token', data.token);
        } catch (error) {
            console.error('AuthProvider: 登录错误:', error);
            throw error;
        }
    };

    const register = async (username: string, password: string, email: string, phone: string) => {
        try {
            console.log("AuthProvider: 开始注册");
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password, email, phone }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || '注册失败');
            }
            console.log("AuthProvider: 注册成功");
        } catch (error) {
            console.error('AuthProvider: 注册错误:', error);
            throw error;
        }
    };

    const logout = () => {
        console.log("AuthProvider: 开始登出");
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        console.log("AuthProvider: 登出完成");
    };

    const updateUser = async (userData: Partial<User>) => {
        try {
            console.log("AuthProvider: 开始更新用户信息");
            if (user) {
                const updatedUser = { ...user, ...userData };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log("AuthProvider: 用户信息更新成功");
            }
        } catch (error) {
            console.error('AuthProvider: 更新用户信息失败:', error);
            throw error;
        }
    };

    const value = {
        user,
        isLoggedIn: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
        updateUser
    };

    if (isLoading) {
        console.log("AuthProvider: 正在加载中...");
        return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
    }

    console.log("AuthProvider: 渲染完成", { user, isLoggedIn: !!user, isAdmin: user?.role === 'admin' });
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}