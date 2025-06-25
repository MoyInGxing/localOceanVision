// 数学建模和预测分析模块
import * as d3 from 'd3';

// 数据类型定义
export interface GrowthData {
  time_point: number;
  length: number;
  species_name: string;
}

export interface ModelResult {
  name: string;
  type: 'linear' | 'polynomial' | 'exponential' | 'logistic';
  equation: string;
  r_squared: number;
  predictions: Array<{
    time_point: number;
    predicted_length: number;
    confidence_interval: [number, number];
  }>;
  analysis: string;
}

export interface ModelingReport {
  models: ModelResult[];
  bestModel: ModelResult;
  dataQuality: {
    sampleSize: number;
    timeSpan: number;
    growthRate: number;
    variability: number;
  };
  recommendations: string[];
}

// 线性回归模型
export function linearRegression(data: GrowthData[]): ModelResult {
  const n = data.length;
  const sumX = data.reduce((sum, d) => sum + d.time_point, 0);
  const sumY = data.reduce((sum, d) => sum + d.length, 0);
  const sumXY = data.reduce((sum, d) => sum + d.time_point * d.length, 0);
  const sumXX = data.reduce((sum, d) => sum + d.time_point * d.time_point, 0);
  const sumYY = data.reduce((sum, d) => sum + d.length * d.length, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // 计算R²
  const meanY = sumY / n;
  const ssTotal = data.reduce((sum, d) => sum + Math.pow(d.length - meanY, 2), 0);
  const ssResidual = data.reduce((sum, d) => {
    const predicted = slope * d.time_point + intercept;
    return sum + Math.pow(d.length - predicted, 2);
  }, 0);
  const rSquared = 1 - (ssResidual / ssTotal);

  // 生成预测
  const maxTime = Math.max(...data.map(d => d.time_point));
  const predictions = [];
  for (let t = maxTime + 1; t <= maxTime + 30; t++) {
    const predicted = slope * t + intercept;
    const standardError = Math.sqrt(ssResidual / (n - 2));
    predictions.push({
      time_point: t,
      predicted_length: Math.max(0, predicted),
      confidence_interval: [
        Math.max(0, predicted - 1.96 * standardError),
        predicted + 1.96 * standardError
      ] as [number, number]
    });
  }

  const analysis = `线性回归模型显示${slope > 0 ? '正向' : '负向'}生长趋势，
每天平均增长${Math.abs(slope).toFixed(3)}cm。
模型拟合度为${(rSquared * 100).toFixed(1)}%，
${rSquared > 0.8 ? '拟合效果良好' : rSquared > 0.6 ? '拟合效果中等' : '拟合效果较差'}。`;

  return {
    name: '线性回归模型',
    type: 'linear',
    equation: `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`,
    r_squared: rSquared,
    predictions,
    analysis
  };
}

// 多项式回归模型（二次）
export function polynomialRegression(data: GrowthData[]): ModelResult {
  const n = data.length;
  const x = data.map(d => d.time_point);
  const y = data.map(d => d.length);
  
  // 构建矩阵方程 Xa = y
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
  const sumX3 = x.reduce((sum, val) => sum + val * val * val, 0);
  const sumX4 = x.reduce((sum, val) => sum + val * val * val * val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
  const sumX2Y = x.reduce((sum, val, i) => sum + val * val * y[i], 0);

  // 解三元线性方程组
  const matrix = [
    [n, sumX, sumX2, sumY],
    [sumX, sumX2, sumX3, sumXY],
    [sumX2, sumX3, sumX4, sumX2Y]
  ];

  const coefficients = gaussianElimination(matrix);
  const [a0, a1, a2] = coefficients;

  // 计算R²
  const meanY = sumY / n;
  const ssTotal = y.reduce((sum, val) => sum + Math.pow(val - meanY, 2), 0);
  const ssResidual = y.reduce((sum, val, i) => {
    const predicted = a0 + a1 * x[i] + a2 * x[i] * x[i];
    return sum + Math.pow(val - predicted, 2);
  }, 0);
  const rSquared = 1 - (ssResidual / ssTotal);

  // 生成预测
  const maxTime = Math.max(...x);
  const predictions = [];
  for (let t = maxTime + 1; t <= maxTime + 30; t++) {
    const predicted = a0 + a1 * t + a2 * t * t;
    const standardError = Math.sqrt(ssResidual / (n - 3));
    predictions.push({
      time_point: t,
      predicted_length: Math.max(0, predicted),
      confidence_interval: [
        Math.max(0, predicted - 1.96 * standardError),
        predicted + 1.96 * standardError
      ] as [number, number]
    });
  }

  const analysis = `二次多项式模型捕捉到了${a2 > 0 ? '加速' : '减速'}生长模式。
${a2 > 0 ? '生长速度随时间递增' : '生长速度随时间递减'}，
模型拟合度为${(rSquared * 100).toFixed(1)}%。
${Math.abs(a2) > 0.001 ? '非线性特征明显' : '接近线性增长'}。`;

  return {
    name: '多项式回归模型',
    type: 'polynomial',
    equation: `y = ${a2.toFixed(6)}x² + ${a1.toFixed(4)}x + ${a0.toFixed(4)}`,
    r_squared: rSquared,
    predictions,
    analysis
  };
}

// 指数增长模型
export function exponentialRegression(data: GrowthData[]): ModelResult {
  // 对y取对数进行线性回归
  const logData = data.map(d => ({
    x: d.time_point,
    y: Math.log(Math.max(0.1, d.length)) // 避免log(0)
  }));

  const n = logData.length;
  const sumX = logData.reduce((sum, d) => sum + d.x, 0);
  const sumY = logData.reduce((sum, d) => sum + d.y, 0);
  const sumXY = logData.reduce((sum, d) => sum + d.x * d.y, 0);
  const sumXX = logData.reduce((sum, d) => sum + d.x * d.x, 0);

  const b = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const a = Math.exp((sumY - b * sumX) / n);

  // 计算R²（基于原始数据）
  const meanY = data.reduce((sum, d) => sum + d.length, 0) / n;
  const ssTotal = data.reduce((sum, d) => sum + Math.pow(d.length - meanY, 2), 0);
  const ssResidual = data.reduce((sum, d) => {
    const predicted = a * Math.exp(b * d.time_point);
    return sum + Math.pow(d.length - predicted, 2);
  }, 0);
  const rSquared = 1 - (ssResidual / ssTotal);

  // 生成预测
  const maxTime = Math.max(...data.map(d => d.time_point));
  const predictions = [];
  for (let t = maxTime + 1; t <= maxTime + 30; t++) {
    const predicted = a * Math.exp(b * t);
    const standardError = Math.sqrt(ssResidual / (n - 2));
    predictions.push({
      time_point: t,
      predicted_length: Math.max(0, predicted),
      confidence_interval: [
        Math.max(0, predicted - 1.96 * standardError),
        predicted + 1.96 * standardError
      ] as [number, number]
    });
  }

  const analysis = `指数增长模型显示${b > 0 ? '指数型' : '指数衰减型'}增长模式。
增长率为${(b * 100).toFixed(2)}%/天，
模型拟合度为${(rSquared * 100).toFixed(1)}%。
${b > 0.05 ? '快速增长阶段' : b > 0.01 ? '稳定增长阶段' : '缓慢增长阶段'}。`;

  return {
    name: '指数增长模型',
    type: 'exponential',
    equation: `y = ${a.toFixed(4)} × e^(${b.toFixed(4)}x)`,
    r_squared: rSquared,
    predictions,
    analysis
  };
}

// Logistic增长模型
export function logisticRegression(data: GrowthData[]): ModelResult {
  // 简化的logistic模型参数估计
  const maxLength = Math.max(...data.map(d => d.length));
  const K = maxLength * 1.2; // 估计承载能力
  const r = 0.1; // 估计增长率
  const t0 = data[0].time_point; // 起始时间
  const L0 = data[0].length; // 起始长度

  // 计算R²
  const meanY = data.reduce((sum, d) => sum + d.length, 0) / data.length;
  const ssTotal = data.reduce((sum, d) => sum + Math.pow(d.length - meanY, 2), 0);
  const ssResidual = data.reduce((sum, d) => {
    const predicted = K / (1 + ((K - L0) / L0) * Math.exp(-r * (d.time_point - t0)));
    return sum + Math.pow(d.length - predicted, 2);
  }, 0);
  const rSquared = 1 - (ssResidual / ssTotal);

  // 生成预测
  const maxTime = Math.max(...data.map(d => d.time_point));
  const predictions = [];
  for (let t = maxTime + 1; t <= maxTime + 30; t++) {
    const predicted = K / (1 + ((K - L0) / L0) * Math.exp(-r * (t - t0)));
    const standardError = Math.sqrt(ssResidual / (data.length - 3));
    predictions.push({
      time_point: t,
      predicted_length: Math.max(0, predicted),
      confidence_interval: [
        Math.max(0, predicted - 1.96 * standardError),
        predicted + 1.96 * standardError
      ] as [number, number]
    });
  }

  const analysis = `Logistic增长模型显示S型增长曲线，
最大承载长度约为${K.toFixed(2)}cm，
当前处于${data[data.length - 1].length / K > 0.8 ? '成熟期' : data[data.length - 1].length / K > 0.5 ? '快速增长期' : '初期增长阶段'}。
模型拟合度为${(rSquared * 100).toFixed(1)}%。`;

  return {
    name: 'Logistic增长模型',
    type: 'logistic',
    equation: `y = ${K.toFixed(2)} / (1 + ${((K - L0) / L0).toFixed(2)} × e^(-${r.toFixed(4)}(x-${t0})))`,
    r_squared: rSquared,
    predictions,
    analysis
  };
}

// 高斯消元法求解线性方程组
function gaussianElimination(matrix: number[][]): number[] {
  const n = matrix.length;
  
  // 前向消元
  for (let i = 0; i < n; i++) {
    // 找到主元
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(matrix[k][i]) > Math.abs(matrix[maxRow][i])) {
        maxRow = k;
      }
    }
    
    // 交换行
    [matrix[i], matrix[maxRow]] = [matrix[maxRow], matrix[i]];
    
    // 消元
    for (let k = i + 1; k < n; k++) {
      const factor = matrix[k][i] / matrix[i][i];
      for (let j = i; j <= n; j++) {
        matrix[k][j] -= factor * matrix[i][j];
      }
    }
  }
  
  // 回代
  const solution = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    solution[i] = matrix[i][n];
    for (let j = i + 1; j < n; j++) {
      solution[i] -= matrix[i][j] * solution[j];
    }
    solution[i] /= matrix[i][i];
  }
  
  return solution;
}

// 综合建模分析
export function performComprehensiveModeling(data: GrowthData[]): ModelingReport {
  if (data.length < 3) {
    throw new Error('数据点不足，至少需要3个数据点进行建模');
  }

  // 运行所有模型
  const models = [
    linearRegression(data),
    polynomialRegression(data),
    exponentialRegression(data),
    logisticRegression(data)
  ];

  // 选择最佳模型（基于R²）
  const bestModel = models.reduce((best, current) => 
    current.r_squared > best.r_squared ? current : best
  );

  // 数据质量评估
  const timePoints = data.map(d => d.time_point).sort((a, b) => a - b);
  const lengths = data.map(d => d.length);
  const timeSpan = Math.max(...timePoints) - Math.min(...timePoints);
  const growthRate = (lengths[lengths.length - 1] - lengths[0]) / timeSpan;
  const meanLength = lengths.reduce((sum, l) => sum + l, 0) / lengths.length;
  const variability = Math.sqrt(lengths.reduce((sum, l) => sum + Math.pow(l - meanLength, 2), 0) / lengths.length) / meanLength;

  const dataQuality = {
    sampleSize: data.length,
    timeSpan,
    growthRate,
    variability
  };

  // 生成建议
  const recommendations = [];
  if (dataQuality.sampleSize < 10) {
    recommendations.push('建议增加更多数据点以提高预测准确性');
  }
  if (dataQuality.timeSpan < 30) {
    recommendations.push('建议延长观测时间以捕捉长期增长趋势');
  }
  if (dataQuality.variability > 0.3) {
    recommendations.push('数据变异性较大，建议检查测量方法的一致性');
  }
  if (bestModel.r_squared < 0.7) {
    recommendations.push('模型拟合度较低，可能需要考虑其他影响因素');
  }
  if (dataQuality.growthRate < 0) {
    recommendations.push('检测到负增长趋势，建议检查环境条件');
  }

  return {
    models,
    bestModel,
    dataQuality,
    recommendations
  };
}

// 生成建模分析图表
export function generateModelingChart(report: ModelingReport, data: GrowthData[]): string {
  const width = 800;
  const height = 600;
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  
  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height);
    
  const xScale = d3.scaleLinear()
    .domain(d3.extent([...data.map(d => d.time_point), ...report.bestModel.predictions.map(p => p.time_point)]) as [number, number])
    .range([margin.left, width - margin.right]);
    
  const yScale = d3.scaleLinear()
    .domain([0, d3.max([...data.map(d => d.length), ...report.bestModel.predictions.map(p => p.predicted_length)]) as number])
    .range([height - margin.bottom, margin.top]);
    
  // 绘制坐标轴
  svg.append('g')
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));
    
  svg.append('g')
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(yScale));
    
  // 绘制原始数据点
  svg.selectAll('.data-point')
    .data(data)
    .enter().append('circle')
    .attr('class', 'data-point')
    .attr('cx', d => xScale(d.time_point))
    .attr('cy', d => yScale(d.length))
    .attr('r', 4)
    .attr('fill', '#2563eb');
    
  // 绘制预测线
  const line = d3.line<any>()
    .x(d => xScale(d.time_point))
    .y(d => yScale(d.predicted_length));
    
  svg.append('path')
    .datum(report.bestModel.predictions)
    .attr('fill', 'none')
    .attr('stroke', '#dc2626')
    .attr('stroke-width', 2)
    .attr('d', line);
    
  // 添加标题和标签
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', margin.top)
    .attr('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .text(`${report.bestModel.name} - R² = ${report.bestModel.r_squared.toFixed(3)}`);
    
  return svg.node()?.outerHTML || '';
}

// 导出建模报告为PDF（简化版本，返回HTML）
export function generateModelingReport(report: ModelingReport, data: GrowthData[], speciesName: string): string {
  const timestamp = new Date().toLocaleString('zh-CN');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${speciesName} 体长增长建模分析报告</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .model-result { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .best-model { background: #e8f5e9; border-left: 4px solid #4caf50; }
        .data-quality { background: #fff3e0; padding: 15px; border-radius: 5px; }
        .recommendations { background: #e3f2fd; padding: 15px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${speciesName} 体长增长建模分析报告</h1>
        <p>生成时间: ${timestamp}</p>
      </div>
      
      <div class="section">
        <h2>数据概况</h2>
        <div class="data-quality">
          <p><strong>样本数量:</strong> ${report.dataQuality.sampleSize} 个数据点</p>
          <p><strong>时间跨度:</strong> ${report.dataQuality.timeSpan.toFixed(1)} 天</p>
          <p><strong>平均增长率:</strong> ${report.dataQuality.growthRate.toFixed(3)} cm/天</p>
          <p><strong>数据变异系数:</strong> ${(report.dataQuality.variability * 100).toFixed(1)}%</p>
        </div>
      </div>
      
      <div class="section">
        <h2>模型比较</h2>
        ${report.models.map(model => `
          <div class="model-result ${model === report.bestModel ? 'best-model' : ''}">
            <h3>${model.name} ${model === report.bestModel ? '(最佳模型)' : ''}</h3>
            <p><strong>方程:</strong> ${model.equation}</p>
            <p><strong>拟合度 (R²):</strong> ${(model.r_squared * 100).toFixed(1)}%</p>
            <p><strong>分析:</strong> ${model.analysis}</p>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <h2>预测结果</h2>
        <table>
          <thead>
            <tr>
              <th>时间点 (天)</th>
              <th>预测体长 (cm)</th>
              <th>置信区间 (cm)</th>
            </tr>
          </thead>
          <tbody>
            ${report.bestModel.predictions.slice(0, 10).map(pred => `
              <tr>
                <td>${pred.time_point}</td>
                <td>${pred.predicted_length.toFixed(2)}</td>
                <td>[${pred.confidence_interval[0].toFixed(2)}, ${pred.confidence_interval[1].toFixed(2)}]</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <div class="section">
        <h2>建议与结论</h2>
        <div class="recommendations">
          ${report.recommendations.map(rec => `<p>• ${rec}</p>`).join('')}
        </div>
      </div>
    </body>
    </html>
  `;
}