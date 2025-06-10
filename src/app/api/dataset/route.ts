import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 本地视频目录
const LOCAL_VIDEO_DIR = path.join(process.cwd(), 'public', 'videos');

export async function GET() {
  try {
    // 检查视频目录是否存在
    if (!fs.existsSync(LOCAL_VIDEO_DIR)) {
      return NextResponse.json(
        { error: '视频目录不存在' },
        { status: 404 }
      );
    }

    // 检查metadata.json是否存在
    const metadataPath = path.join(process.cwd(), 'public', 'dataset', 'metadata.json');
    if (!fs.existsSync(metadataPath)) {
      // 如果metadata.json不存在，创建默认数据集
      const defaultDataset = {
        videos: [
          {
            id: 'video1',
            name: '水下鱼群活动 1',
            url: '/videos/3883897-hd_1920_1080_30fps.mp4',
            description: '高清水下鱼群活动视频',
            metadata: {
              duration: '30s',
              resolution: '1080p',
              frameRate: '30fps'
            }
          },
          {
            id: 'video2',
            name: '水下鱼群活动 2',
            url: '/videos/855798-hd_1920_1080_30fps.mp4',
            description: '高清水下鱼群活动视频',
            metadata: {
              duration: '30s',
              resolution: '1080p',
              frameRate: '30fps'
            }
          }
        ],
        annotations: []
      };

      // 确保dataset目录存在
      const datasetDir = path.join(process.cwd(), 'public', 'dataset');
      if (!fs.existsSync(datasetDir)) {
        fs.mkdirSync(datasetDir, { recursive: true });
      }

      // 写入默认数据集
      fs.writeFileSync(metadataPath, JSON.stringify(defaultDataset, null, 2));
      return NextResponse.json(defaultDataset);
    }

    // 读取并返回数据集
    const dataset = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    return NextResponse.json(dataset);
  } catch (error) {
    console.error('获取数据集失败:', error);
    return NextResponse.json(
      { error: '获取数据集失败' },
      { status: 500 }
    );
  }
} 