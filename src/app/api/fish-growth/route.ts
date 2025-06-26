import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 定义鱼类体长数据类型
interface FishGrowthData {
  id?: string;
  species_name: string;
  time_point: number;
  length: number;
  upload_date?: Date;
}

// 数据存储文件路径
const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'fish-growth.json');

// 确保数据目录存在
function ensureDataDirectory() {
  const dataDir = path.dirname(DATA_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// 读取现有数据
function readExistingData(): FishGrowthData[] {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('读取数据文件错误:', error);
    return [];
  }
}

// 保存数据到文件
function saveData(data: FishGrowthData[]) {
  try {
    ensureDataDirectory();
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('保存数据文件错误:', error);
    throw error;
  }
}

// POST - 上传鱼类体长数据
export async function POST(request: NextRequest) {
  try {
    const uploadedData: FishGrowthData[] = await request.json();
    
    // 验证数据格式
    for (const item of uploadedData) {
      if (!item.species_name || typeof item.time_point !== 'number' || typeof item.length !== 'number') {
        return NextResponse.json(
          { error: '数据格式错误，请检查species_name、time_point和length字段' },
          { status: 400 }
        );
      }
    }
    
    // 读取现有数据
    const existingData = readExistingData();
    
    // 为新数据添加ID和上传时间
    const newData = uploadedData.map((item, index) => ({
      ...item,
      id: `${Date.now()}_${index}`,
      upload_date: new Date()
    }));
    
    // 合并数据
    const allData = [...existingData, ...newData];
    
    // 保存到文件
    saveData(allData);
    
    return NextResponse.json({
      message: '数据上传成功',
      count: newData.length,
      total: allData.length
    });
    
  } catch (error) {
    console.error('上传数据错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// GET - 获取鱼类体长数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const species = searchParams.get('species');
    
    let data = readExistingData();
    
    // 如果指定了物种，则过滤数据
    if (species) {
      data = data.filter(item => item.species_name === species);
    }
    
    return NextResponse.json({
      data,
      count: data.length
    });
    
  } catch (error) {
    console.error('获取数据错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}

// DELETE - 删除指定数据
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const species = searchParams.get('species');
    
    let data = readExistingData();
    
    if (id) {
      // 删除指定ID的数据
      data = data.filter(item => item.id !== id);
    } else if (species) {
      // 删除指定物种的所有数据
      data = data.filter(item => item.species_name !== species);
    } else {
      return NextResponse.json(
        { error: '请提供id或species参数' },
        { status: 400 }
      );
    }
    
    saveData(data);
    
    return NextResponse.json({
      message: '数据删除成功',
      remaining: data.length
    });
    
  } catch (error) {
    console.error('删除数据错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    );
  }
}