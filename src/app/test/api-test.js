// API测试脚本 - 诊断监测点API调用问题
// 运行方式: node api-test.js

const fetch = require('node-fetch');

// 测试配置
const API_BASE_URL = 'http://localhost:8082';
const ENDPOINTS = {
  monitoringPoints: '/api/monitoring-points',
  waterQuality: '/api/water-quality',
  waterQualityByArea: '/api/water-quality/area/point_1'
};

// 颜色输出函数
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 测试单个API端点
async function testEndpoint(name, endpoint) {
  log('blue', `\n=== 测试 ${name} ===`);
  log('blue', `URL: ${API_BASE_URL}${endpoint}`);
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    const endTime = Date.now();
    
    log('yellow', `响应时间: ${endTime - startTime}ms`);
    log('yellow', `状态码: ${response.status}`);
    log('yellow', `状态文本: ${response.statusText}`);
    
    // 打印响应头
    log('yellow', '响应头:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        log('green', '✓ API调用成功');
        log('green', '响应数据结构:');
        console.log(JSON.stringify(data, null, 2));
        
        // 分析数据结构
        analyzeDataStructure(name, data);
      } else {
        const text = await response.text();
        log('yellow', '响应内容 (非JSON):');
        console.log(text);
      }
    } else {
      const errorText = await response.text();
      log('red', `✗ API调用失败: ${response.status}`);
      log('red', `错误信息: ${errorText}`);
    }
    
  } catch (error) {
    log('red', `✗ 网络错误: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      log('red', '提示: 后端服务器可能未启动或端口不正确');
    }
  }
}

// 分析数据结构
function analyzeDataStructure(apiName, data) {
  log('blue', '\n--- 数据结构分析 ---');
  
  if (apiName === '监测点API') {
    if (data.points && Array.isArray(data.points)) {
      log('green', `✓ 找到 points 数组，包含 ${data.points.length} 个监测点`);
      
      if (data.points.length > 0) {
        const firstPoint = data.points[0];
        log('green', '第一个监测点的字段:');
        Object.keys(firstPoint).forEach(key => {
          console.log(`  - ${key}: ${typeof firstPoint[key]}`);
        });
        
        // 检查必需字段
        const requiredFields = ['id', 'name', 'location', 'basin', 'temperature', 'ph', 'oxygen', 'turbidity'];
        const missingFields = requiredFields.filter(field => !(field in firstPoint));
        
        if (missingFields.length > 0) {
          log('red', `✗ 缺少必需字段: ${missingFields.join(', ')}`);
        } else {
          log('green', '✓ 所有必需字段都存在');
        }
      } else {
        log('yellow', '⚠ points 数组为空');
      }
    } else if (Array.isArray(data)) {
      log('yellow', `⚠ 数据是数组格式，包含 ${data.length} 个元素`);
      log('yellow', '前端期望的格式是: { points: [...] }');
    } else {
      log('red', '✗ 数据格式不匹配，前端期望 { points: [...] } 格式');
    }
  }
  
  // 检查数据类型
  log('blue', `数据类型: ${typeof data}`);
  if (typeof data === 'object' && data !== null) {
    log('blue', `顶级字段: ${Object.keys(data).join(', ')}`);
  }
}

// 测试前端期望的数据格式
function testFrontendCompatibility() {
  log('blue', '\n=== 前端兼容性测试 ===');
  
  // 模拟前端代码逻辑
  const mockApiResponse = {
    // 这里可以放入实际的API响应进行测试
  };
  
  log('yellow', '前端代码期望:');
  console.log('const data = await response.json();');
  console.log('const points = data.points || [];');
  console.log('setMonitoringPoints(points);');
  
  log('yellow', '如果API返回空数组或undefined，前端会显示"没有找到监测点"');
}

// 生成测试报告
function generateTestReport() {
  log('blue', '\n=== 测试报告和建议 ===');
  
  log('yellow', '常见问题和解决方案:');
  console.log('1. API返回数据格式不匹配');
  console.log('   - 检查后端是否返回 { points: [...] } 格式');
  console.log('   - 或修改前端代码适配实际返回格式');
  
  console.log('\n2. CORS跨域问题');
  console.log('   - 检查后端是否设置了正确的CORS头');
  console.log('   - 浏览器控制台是否有CORS错误');
  
  console.log('\n3. 数据为空');
  console.log('   - 检查数据库是否有监测点数据');
  console.log('   - 检查后端查询逻辑');
  
  console.log('\n4. 网络连接问题');
  console.log('   - 确认后端服务器运行在正确端口');
  console.log('   - 检查防火墙设置');
}

// 主测试函数
async function runTests() {
  log('green', '开始API诊断测试...');
  log('green', '='.repeat(50));
  
  // 测试各个端点
  await testEndpoint('监测点API', ENDPOINTS.monitoringPoints);
  await testEndpoint('水质数据API', ENDPOINTS.waterQuality);
  await testEndpoint('区域水质API', ENDPOINTS.waterQualityByArea);
  
  // 前端兼容性测试
  testFrontendCompatibility();
  
  // 生成报告
  generateTestReport();
  
  log('green', '\n测试完成!');
}

// 运行测试
if (require.main === module) {
  runTests().catch(error => {
    log('red', `测试运行出错: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { testEndpoint, analyzeDataStructure };