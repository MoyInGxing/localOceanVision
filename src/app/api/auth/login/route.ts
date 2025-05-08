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
    const { username, password } = await request.json();

    // 查找用户
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json({
      ...userWithoutPassword,
      message: '登录成功'
    });
  } catch (error) {
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
} 