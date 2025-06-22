'use client';

import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
  phone?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState('users');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('未找到认证token');
      }

      console.log('正在获取用户列表，使用token:', token);
      
      const response = await fetch('http://localhost:8080/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('服务器响应状态:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '获取用户列表失败');
      }

      const data = await response.json();
      console.log('获取到的用户数据:', data);
      
      setUsers(data.users);
    } catch (err) {
      console.error('获取用户列表时出错:', err);
      setError(err instanceof Error ? err.message : '获取用户列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        throw new Error('删除用户失败');
      }
      setUsers(users.filter(u => u.id !== userId));
    } catch (err) {
      setError('删除用户失败');
      console.error('Error deleting user:', err);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) {
        throw new Error('更新用户角色失败');
      }
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      setError('更新用户角色失败');
      console.error('Error updating user role:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'users'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                用户管理
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-6 text-sm font-medium ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                系统设置
              </button>
            </nav>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            {activeTab === 'users' ? (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">用户列表</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          用户名
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          角色
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                              <option value="admin">管理员</option>
                              <option value="user">普通用户</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-medium text-gray-900">系统设置</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      系统名称
                    </label>
                    <input
                      type="text"
                      defaultValue="智慧海洋牧场可视化系统"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      系统描述
                    </label>
                    <textarea
                      rows={4}
                      defaultValue="智慧海洋牧场可视化系统是一个集成了海洋环境监测、养殖管理、数据分析等功能的综合平台。"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    保存设置
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 