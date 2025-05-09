import { NextResponse } from 'next/server';

// 模拟用户数据
const users = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    role: 'user'
  }
];

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    // 验证用户是否存在
    const user = users.find(u => u.id === userId);

    if (!user) {
      return NextResponse.json(
        { error: '无效的会话' },
        { status: 401 }
      );
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
} 