'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  role: string;
}

interface TestResult {
  endpoint: string;
  request: any;
  response: any;
  status: 'success' | 'error';
  message: string;
}

interface LoginResponse {
  token: string;
  user: {
    id: number;
    username: string;
    role: string;
  };
  error?: string;
}

export default function TestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [testUser, setTestUser] = useState({
    username: `testuser_${Math.floor(Math.random() * 1000)}`,
    password: 'Test123456'
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (token) {
      // Try to fetch user profile if token exists
      testProfile();
    }
    // testProfile为本地函数，不会变，无需加入依赖
  }, []);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const resetAuth = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentUser(null);
  };

  const testRegister = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpass123'
        })
      });

      const data = await response.json();
      
      addTestResult({
        endpoint: '/api/register',
        request: { username: 'testuser', password: 'testpass123' },
        response: data,
        status: response.ok ? 'success' : 'error',
        message: response.ok ? '注册成功' : data.error || '注册失败'
      });

      if (response.ok) {
        setTimeout(() => testLogin(), 1000);
      }
    } catch (error: any) {
      addTestResult({
        endpoint: '/api/register',
        request: { username: 'testuser', password: 'testpass123' },
        response: error.message,
        status: 'error',
        message: '请求失败'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'testuser',
          password: 'testpass123'
        })
      });

      const data = await response.json();
      console.log('登录响应:', data);

      addTestResult({
        endpoint: '/api/login',
        request: { username: 'testuser', password: 'testpass123' },
        response: data,
        status: response.ok ? 'success' : 'error',
        message: response.ok ? '登录成功' : data.error || '登录失败'
      });

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        console.log('保存的 token:', data.token);
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        
        // 立即尝试获取用户信息
        await testProfile();
      }
    } catch (error: any) {
      console.error('登录失败:', error);
      addTestResult({
        endpoint: '/api/login',
        request: { username: 'testuser', password: 'testpass123' },
        response: error.message,
        status: 'error',
        message: '请求失败'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testProfile = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      console.log('获取到的 token:', token);

      if (!token) {
        addTestResult({
          endpoint: '/api/users/profile',
          request: null,
          response: null,
          status: 'error',
          message: '未登录，请先登录'
        });
        return;
      }

      console.log('发送请求到 /api/users/profile，使用 token:', token);
      const response = await fetch('/api/users/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('用户资料响应状态:', response.status);

      const data = await response.json();
      console.log('用户资料响应数据:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      addTestResult({
        endpoint: '/api/users/profile',
        request: { token: '***' },
        response: data,
        status: response.ok ? 'success' : 'error',
        message: response.ok ? '获取个人信息成功' : '获取个人信息失败'
      });

      if (response.ok) {
        setCurrentUser(data.user);
      }
    } catch (error: any) {
      console.error('获取用户资料失败:', error);
      addTestResult({
        endpoint: '/api/users/profile',
        request: null,
        response: error.message,
        status: 'error',
        message: `请求失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminDashboard = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        addTestResult({
          endpoint: '/api/admin/dashboard',
          request: null,
          response: null,
          status: 'error',
          message: '未登录，请先登录'
        });
        return;
      }

      console.log('发送请求到 /api/admin/dashboard，使用 token:', token);
      const response = await fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('管理员面板响应状态:', response.status);
      const data = await response.json();
      console.log('管理员面板响应数据:', data);
      
      addTestResult({
        endpoint: '/api/admin/dashboard',
        request: { token: '***' },
        response: data,
        status: response.ok ? 'success' : 'error',
        message: response.ok ? '获取管理员面板成功' : data.error || '获取管理员面板失败'
      });
    } catch (error: any) {
      console.error('获取管理员面板失败:', error);
      addTestResult({
        endpoint: '/api/admin/dashboard',
        request: null,
        response: error.message,
        status: 'error',
        message: `请求失败: ${error.message}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testAdminLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: 'admin123'
        })
      });

      const data = await response.json();
      console.log('管理员登录响应:', data);

      addTestResult({
        endpoint: '/api/login (管理员)',
        request: { username: 'admin', password: 'admin123' },
        response: data,
        status: response.ok ? 'success' : 'error',
        message: response.ok ? '管理员登录成功' : data.error || '管理员登录失败'
      });

      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        console.log('保存的管理员 token:', data.token);
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        
        // 立即尝试获取管理员面板
        await testAdminDashboard();
      }
    } catch (error: any) {
      console.error('管理员登录失败:', error);
      addTestResult({
        endpoint: '/api/login (管理员)',
        request: { username: 'admin', password: 'admin123' },
        response: error.message,
        status: 'error',
        message: '请求失败'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    resetAuth();
    addTestResult({
      endpoint: 'logout',
      request: null,
      response: null,
      status: 'success',
      message: '已退出登录'
    });
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>
        API 测试面板
      </h1>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>测试步骤：</h2>
        <ol style={{ marginLeft: '20px' }}>
          <li style={{ marginBottom: '5px' }}>点击&ldquo;测试注册&rdquo;按钮创建新用户</li>
          <li style={{ marginBottom: '5px' }}>系统会自动尝试登录</li>
          <li style={{ marginBottom: '5px' }}>登录成功后，会自动获取用户信息</li>
          <li style={{ marginBottom: '5px' }}>点击&ldquo;测试管理员登录&rdquo;按钮测试管理员功能</li>
          <li>最后可以测试管理员面板</li>
        </ol>
      </div>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: isLoggedIn ? '#f0fdf4' : '#fefce8',
        borderRadius: '8px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <p style={{ fontSize: '16px', fontWeight: 'bold' }}>
            当前状态：{isLoggedIn ? '已登录' : '未登录'}
          </p>
          {isLoggedIn && currentUser && (
            <p style={{ marginTop: '5px' }}>
              用户名: {currentUser.username} | 角色: {currentUser.role}
            </p>
          )}
        </div>
        
        {isLoggedIn ? (
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 12px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        ) : (
          <button
            onClick={() => {
              setTestUser({
                username: `testuser_${Math.floor(Math.random() * 1000)}`,
                password: 'Test123456'
              });
              addTestResult({
                endpoint: 'reset',
                request: null,
                response: null,
                status: 'success',
                message: '已重置测试用户'
              });
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            重置测试用户
          </button>
        )}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '15px',
        marginBottom: '30px'
      }}>
        <button
          onClick={testRegister}
          disabled={isLoading}
          style={{
            padding: '15px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          测试注册
        </button>

        <button
          onClick={testLogin}
          disabled={isLoading}
          style={{
            padding: '15px',
            backgroundColor: '#16a34a',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          测试登录
        </button>

        <button
          onClick={testProfile}
          disabled={isLoading || !isLoggedIn}
          style={{
            padding: '15px',
            backgroundColor: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            opacity: (isLoading || !isLoggedIn) ? 0.5 : 1
          }}
        >
          测试个人信息
        </button>

        <button
          onClick={testAdminLogin}
          disabled={isLoading}
          style={{
            padding: '15px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          测试管理员登录
        </button>

        <button
          onClick={testAdminDashboard}
          disabled={isLoading || !isLoggedIn}
          style={{
            padding: '15px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            opacity: (isLoading || !isLoggedIn) ? 0.5 : 1
          }}
        >
          测试管理员面板
        </button>

        <button
          onClick={clearTestResults}
          style={{
            padding: '15px',
            backgroundColor: '#64748b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            gridColumn: '1 / -1'
          }}
        >
          清空测试结果
        </button>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2 style={{ fontSize: '20px' }}>测试结果</h2>
          <span style={{ color: '#64748b' }}>共 {testResults.length} 条记录</span>
        </div>
        
        {testResults.length === 0 ? (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px',
            textAlign: 'center',
            color: '#64748b'
          }}>
            暂无测试结果，请点击上方按钮开始测试
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[...testResults].reverse().map((result, index) => (
              <div
                key={index}
                style={{
                  padding: '15px',
                  backgroundColor: result.status === 'success' ? '#f0fdf4' : '#fef2f2',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${result.status === 'success' ? '#16a34a' : '#dc2626'}`
                }}
              >
                <h3 style={{ fontSize: '16px', marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: result.status === 'success' ? '#16a34a' : '#dc2626',
                    marginRight: '8px'
                  }}></span>
                  {result.endpoint}
                  <span style={{ 
                    marginLeft: '8px',
                    color: result.status === 'success' ? '#16a34a' : '#dc2626',
                    fontWeight: 'bold'
                  }}>
                    {result.message}
                  </span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <h4 style={{ marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>请求数据：</h4>
                    <pre style={{ 
                      backgroundColor: '#f3f4f6',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '14px',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify(result.request, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h4 style={{ marginBottom: '5px', fontSize: '14px', color: '#64748b' }}>响应数据：</h4>
                    <pre style={{ 
                      backgroundColor: '#f3f4f6',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '14px',
                      maxHeight: '200px'
                    }}>
                      {JSON.stringify(result.response, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}