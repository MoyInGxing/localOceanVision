// 浏览器API测试脚本 - 可直接在浏览器控制台运行
// 使用方法: 复制此代码到浏览器控制台并运行 testMonitoringPointsAPI()

// 测试监测点API的函数
async function testMonitoringPointsAPI() {
  console.log('%c=== 监测点API诊断测试 ===', 'color: blue; font-weight: bold');
  
  const apiUrl = 'http://localhost:8082/api/monitoring-points';
  console.log(`测试URL: ${apiUrl}`);
  
  try {
    console.log('%c1. 发送API请求...', 'color: yellow');
    const startTime = performance.now();
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const endTime = performance.now();
    console.log(`%c响应时间: ${(endTime - startTime).toFixed(2)}ms`, 'color: green');
    
    console.log('%c2. 检查响应状态...', 'color: yellow');
    console.log(`状态码: ${response.status}`);
    console.log(`状态文本: ${response.statusText}`);
    console.log('响应头:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('%c✗ API调用失败', 'color: red; font-weight: bold');
      console.error('错误信息:', errorText);
      return;
    }
    
    console.log('%c3. 解析响应数据...', 'color: yellow');
    const data = await response.json();
    console.log('%c✓ API调用成功', 'color: green; font-weight: bold');
    console.log('原始响应数据:', data);
    
    console.log('%c4. 分析数据结构...', 'color: yellow');
    analyzeMonitoringPointsData(data);
    
    console.log('%c5. 模拟前端处理逻辑...', 'color: yellow');
    simulateFrontendLogic(data);
    
  } catch (error) {
    console.error('%c✗ 网络错误', 'color: red; font-weight: bold');
    console.error('错误详情:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('%c可能的原因:', 'color: orange');
      console.error('1. 后端服务器未启动');
      console.error('2. CORS跨域问题');
      console.error('3. 网络连接问题');
    }
  }
}

// 分析监测点数据结构
function analyzeMonitoringPointsData(data) {
  console.log('%c--- 数据结构分析 ---', 'color: blue');
  
  console.log(`数据类型: ${typeof data}`);
  console.log(`是否为数组: ${Array.isArray(data)}`);
  
  if (data && typeof data === 'object') {
    console.log(`顶级字段: [${Object.keys(data).join(', ')}]`);
    
    // 检查是否有points字段
    if ('points' in data) {
      console.log('%c✓ 找到 points 字段', 'color: green');
      const points = data.points;
      
      if (Array.isArray(points)) {
        console.log(`%c✓ points 是数组，包含 ${points.length} 个元素`, 'color: green');
        
        if (points.length > 0) {
          console.log('第一个监测点数据:', points[0]);
          checkRequiredFields(points[0]);
        } else {
          console.log('%c⚠ points 数组为空', 'color: orange');
        }
      } else {
        console.log('%c✗ points 不是数组', 'color: red');
      }
    } else if (Array.isArray(data)) {
      console.log('%c⚠ 数据直接是数组格式', 'color: orange');
      console.log(`数组长度: ${data.length}`);
      
      if (data.length > 0) {
        console.log('第一个元素:', data[0]);
        checkRequiredFields(data[0]);
      }
    } else {
      console.log('%c✗ 未找到 points 字段，且数据不是数组', 'color: red');
    }
  } else {
    console.log('%c✗ 数据不是对象类型', 'color: red');
  }
}

// 检查必需字段
function checkRequiredFields(point) {
  console.log('%c--- 字段检查 ---', 'color: blue');
  
  const requiredFields = {
    'id': 'string',
    'name': 'string', 
    'location': 'object',
    'basin': 'string',
    'temperature': 'number',
    'ph': 'number',
    'oxygen': 'number',
    'turbidity': 'number'
  };
  
  const actualFields = Object.keys(point);
  console.log(`实际字段: [${actualFields.join(', ')}]`);
  
  let missingFields = [];
  let typeErrors = [];
  
  for (const [field, expectedType] of Object.entries(requiredFields)) {
    if (!(field in point)) {
      missingFields.push(field);
    } else {
      const actualType = typeof point[field];
      if (actualType !== expectedType && point[field] !== null) {
        typeErrors.push(`${field}: 期望 ${expectedType}, 实际 ${actualType}`);
      }
    }
  }
  
  if (missingFields.length === 0) {
    console.log('%c✓ 所有必需字段都存在', 'color: green');
  } else {
    console.log(`%c✗ 缺少字段: [${missingFields.join(', ')}]`, 'color: red');
  }
  
  if (typeErrors.length === 0) {
    console.log('%c✓ 字段类型正确', 'color: green');
  } else {
    console.log('%c⚠ 类型不匹配:', 'color: orange');
    typeErrors.forEach(error => console.log(`  ${error}`));
  }
}

// 模拟前端处理逻辑
function simulateFrontendLogic(data) {
  console.log('%c--- 模拟前端逻辑 ---', 'color: blue');
  
  // 模拟前端代码中的数据处理
  console.log('执行: const points = data.points || [];');
  const points = data.points || [];
  
  console.log(`结果: points.length = ${points.length}`);
  
  if (points.length === 0) {
    console.log('%c⚠ 前端会显示"没有找到监测点"', 'color: orange');
    console.log('原因分析:');
    
    if (!data.points) {
      console.log('- API响应中没有 points 字段');
      console.log('- 建议: 检查后端是否返回正确的数据格式');
    } else if (data.points.length === 0) {
      console.log('- points 数组为空');
      console.log('- 建议: 检查数据库中是否有监测点数据');
    }
  } else {
    console.log('%c✓ 前端应该能正常显示监测点', 'color: green');
  }
  
  // 检查数据是否直接是数组
  if (Array.isArray(data) && data.length > 0) {
    console.log('%c💡 建议修改前端代码:', 'color: blue');
    console.log('将 const points = data.points || []; 改为:');
    console.log('const points = Array.isArray(data) ? data : (data.points || []);');
  }
}

// 快速测试函数
function quickTest() {
  console.log('%c快速API测试', 'color: purple; font-weight: bold');
  testMonitoringPointsAPI();
}

// 导出函数供控制台使用
window.testMonitoringPointsAPI = testMonitoringPointsAPI;
window.quickTest = quickTest;

console.log('%c监测点API测试工具已加载', 'color: green; font-weight: bold');
console.log('%c使用方法: 运行 testMonitoringPointsAPI() 或 quickTest()', 'color: blue');