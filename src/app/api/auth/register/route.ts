import { NextResponse } from 'next/server';

// 模拟用户数据存储
let users: any[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    email: 'admin@example.com',
    phone: '13800138000'
  },
  {
    id: '2',
    username: 'user',
    password: 'user123',
    role: 'user',
    email: 'user@example.com',
    phone: '13800138001'
  }
];

export async function POST(request: Request) {
  try {
    const { username, password, email, phone } = await request.json();

    // 验证必填字段
    if (!username || !password || !email || !phone) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      );
    }

    // 检查用户名是否已存在
    if (users.some(user => user.username === username)) {
      return NextResponse.json(
        { error: '用户名已存在' },
        { status: 400 }
      );
    }

    // 创建新用户
    const newUser = {
      id: String(users.length + 1),
      username,
      password,
      role: 'user',
      email,
      phone
    };

    // 在实际应用中，这里应该将用户数据保存到数据库
    users.push(newUser);

    return NextResponse.json(
      { message: '注册成功' },
      { status: 201 }
    );
  } catch (error) {
    console.error('注册失败:', error);
    return NextResponse.json(
      { error: '注册失败，请稍后重试' },
      { status: 500 }
    );
  }
} 