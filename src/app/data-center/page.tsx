'use client';

import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import ProtectedRoute from '../components/ProtectedRoute';
import { FaDownload, FaFilter, FaSearch } from 'react-icons/fa';

// 定义数据类型
interface DataPoint {
  date: Date;
  value: number;
}

export default function DataCenter() {
  const [dateRange, setDateRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeRange, setTimeRange] = useState(7); // 默认显示最近7天
  
  // 引用DOM元素
  const temperatureChartRef = useRef<SVGSVGElement | null>(null);
  const productionChartRef = useRef<SVGSVGElement | null>(null);
  const chinaMapRef = useRef<SVGSVGElement | null>(null);
  
  // 生成时间数据
  const generateTimeData = (range: number): DataPoint[] => {
    const data: DataPoint[] = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date,
        value: Math.random() * 10 + 20 // 水温范围20-30°C
      });
    }
    return data;
  };
  
  // 生成产量数据
  const generateProductionData = (range: number): DataPoint[] => {
    const data: DataPoint[] = [];
    const now = new Date();
    for (let i = range - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      data.push({
        date: date,
        value: Math.random() * 30 + 50 // 产量范围50-80吨
      });
    }
    return data;
  };
  
  // 创建水温趋势图
  const createTemperatureChart = (data: DataPoint[]) => {
    if (!temperatureChartRef.current) return;
    
    // 清除之前的图表
    d3.select(temperatureChartRef.current).selectAll("*").remove();
    
    // 设置图表尺寸和边距
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = temperatureChartRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // 创建SVG
    const svg = d3.select(temperatureChartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // 添加渐变背景
    const defs = svg.append("defs");
    
    // 创建线性渐变
    const gradient = defs.append("linearGradient")
      .attr("id", "temperature-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#48cae4")
      .attr("stop-opacity", 0.8);
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#48cae4")
      .attr("stop-opacity", 0.2);
    
    // 创建X轴比例尺
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);
    
    // 创建Y轴比例尺
    const y = d3.scaleLinear()
      .domain([d3.min(data, d => d.value) as number - 1, d3.max(data, d => d.value) as number + 1])
      .range([height, 0]);
    
    // 添加X轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(timeRange > 14 ? 7 : timeRange))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");
    
    // 添加Y轴
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}°C`));
    
    // 添加网格线
    svg.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "rgba(0, 0, 0, 0.1)");
    
    // 创建线条生成器
    const line = d3.line<DataPoint>()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX); // 使用平滑曲线
    
    // 创建面积生成器
    const area = d3.area<DataPoint>()
      .x(d => x(d.date))
      .y0(height)
      .y1(d => y(d.value))
      .curve(d3.curveMonotoneX);
    
    // 添加面积
    svg.append("path")
      .datum(data)
      .attr("fill", "url(#temperature-gradient)")
      .attr("d", area);
    
    // 添加线条路径
    const path = svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#0096c7")
      .attr("stroke-width", 3)
      .attr("d", line);
    
    // 添加动画效果
    const pathLength = path.node()?.getTotalLength() || 0;
    path.attr("stroke-dasharray", pathLength)
      .attr("stroke-dashoffset", pathLength)
      .transition()
      .duration(1500)
      .attr("stroke-dashoffset", 0);
    
    // 添加数据点
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.date))
      .attr("cy", d => y(d.value))
      .attr("r", 0) // 初始半径为0
      .attr("fill", "#0096c7")
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .transition() // 添加过渡动画
      .delay((_, i) => i * 100) // 依次显示
      .duration(500)
      .attr("r", 5); // 最终半径
    
    // 添加交互提示
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none");
    
    // 添加交互效果
    svg.selectAll(".dot")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 8);
        
        tooltip
          .style("visibility", "visible")
          .html(`日期: ${(d as DataPoint).date.toLocaleDateString('zh-CN')} <br/> 水温: ${(d as DataPoint).value.toFixed(1)}°C`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 5);
        
        tooltip.style("visibility", "hidden");
      });
    
    // 添加标题
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("水温趋势 (°C)");
    
    // 添加Y轴标签
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("水温 (°C)");
  };
  
  // 创建产量统计图
  const createProductionChart = (data: DataPoint[]) => {
    if (!productionChartRef.current) return;
    
    // 清除之前的图表
    d3.select(productionChartRef.current).selectAll("*").remove();
    
    // 设置图表尺寸和边距
    const margin = { top: 30, right: 30, bottom: 50, left: 60 };
    const width = productionChartRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // 创建SVG
    const svg = d3.select(productionChartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);
    
    // 创建X轴比例尺 (带间隔的带状图)
    const x = d3.scaleBand()
      .domain(data.map(d => d.date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })))
      .range([0, width])
      .padding(0.2);
    
    // 创建Y轴比例尺
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) as number * 1.1]) // 增加10%的空间
      .range([height, 0]);
    
    // 添加X轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");
    
    // 添加Y轴
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}吨`));
    
    // 添加网格线
    svg.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(y.ticks(5))
      .enter()
      .append("line")
      .attr("x1", 0)
      .attr("x2", width)
      .attr("y1", d => y(d))
      .attr("y2", d => y(d))
      .attr("stroke", "rgba(0, 0, 0, 0.1)");
    
    // 创建渐变
    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "production-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");
    
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4361ee");
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#7209b7");
    
    // 添加柱状图
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })) as number)
      .attr("width", x.bandwidth())
      .attr("y", height) // 初始位置在底部
      .attr("height", 0) // 初始高度为0
      .attr("fill", "url(#production-gradient)")
      .attr("rx", 4) // 圆角
      .attr("ry", 4) // 圆角
      .transition() // 添加过渡动画
      .delay((_, i) => i * 100) // 依次显示
      .duration(800)
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value));
    
    // 添加数值标签
    svg.selectAll(".label")
      .data(data)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => (x(d.date.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })) as number) + x.bandwidth() / 2)
      .attr("y", d => y(d.value) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "10px")
      .style("fill", "#333")
      .style("opacity", 0) // 初始透明度为0
      .text(d => d.value.toFixed(1))
      .transition()
      .delay((_, i) => i * 100 + 400) // 在柱状图显示后显示
      .duration(500)
      .style("opacity", 1); // 最终透明度为1
    
    // 添加交互提示
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none");
    
    // 添加交互效果
    svg.selectAll(".bar")
      .on("mouseover", function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.8);
        
        tooltip
          .style("visibility", "visible")
          .html(`日期: ${(d as DataPoint).date.toLocaleDateString('zh-CN')} <br/> 产量: ${(d as DataPoint).value.toFixed(1)}吨`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1);
        
        tooltip.style("visibility", "hidden");
      });
    
    // 添加标题
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("产量统计 (吨)");
    
    // 添加Y轴标签
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -height / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .text("产量 (吨)");
  };
  
  // 创建中国地图可视化
  const createChinaMap = async () => {
    if (!chinaMapRef.current) return;
    
    // 清除之前的图表
    d3.select(chinaMapRef.current).selectAll("*").remove();
    
    // 设置地图尺寸和边距
    const width = chinaMapRef.current.clientWidth;
    const height = 500;
    
    // 创建SVG
    const svg = d3.select(chinaMapRef.current)
      .attr("width", width)
      .attr("height", height);
    
    // 定义投影
    const projection = d3.geoMercator();
    
    // 创建路径生成器
    const pathGenerator = d3.geoPath().projection(projection);
    
    // 创建提示框
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("opacity", 0)
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none");
    
    try {
      // 加载GeoJSON数据
      const geoData = await d3.json("/dataset/china.json");
      
      // 使投影适应数据并居中
      projection.fitSize([width, height], geoData as any);
      
      // 绘制地图路径
      const mapGroup = svg.append("g").attr("class", "map-group");
      
      mapGroup.selectAll("path")
        .data((geoData as any).features)
        .enter()
        .append("path")
        .attr("class", "province")
        .attr("d", (d: any) => pathGenerator(d))
        .attr("fill", "#4361ee")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("data-name", (d: any) => d.properties.name)
        .on("mouseover", function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill", "#7209b7")
            .attr("opacity", 1);
          
          tooltip.transition()
            .duration(200)
            .style("opacity", 0.9)
            .style("visibility", "visible")
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
          
          tooltip.html(`<strong>${(d as any).properties.name}</strong>`);
        })
        .on("mouseout", function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr("fill", "#4361ee")
            .attr("opacity", 0.8);
          
          tooltip.transition()
            .duration(500)
            .style("opacity", 0)
            .style("visibility", "hidden");
        });
      
      // 添加标题
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("中国地区分布");
      
      // 添加缩放和拖拽功能
      const zoom = d3.zoom()
        .scaleExtent([1, 8]) // 缩放范围
        .on("zoom", (event) => {
          mapGroup.attr("transform", event.transform);
        });
      svg.call(zoom as any);
      
    } catch (error) {
      console.error("加载或绘制地图数据失败:", error);
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#d00")
        .text("地图数据加载失败，请检查控制台。");
    }
  };

  // 当时间范围或指标变化时重新渲染图表
  useEffect(() => {
    const temperatureData = generateTimeData(timeRange);
    const productionData = generateProductionData(timeRange);
    
    createTemperatureChart(temperatureData);
    createProductionChart(productionData);
    createChinaMap().catch(error => console.error("地图渲染失败:", error));
    
    // 清理函数
    return () => {
      d3.selectAll(".tooltip").remove();
    };
  }, [timeRange, dateRange, selectedMetric]);
  
  // 窗口大小变化时重新渲染图表
  useEffect(() => {
    const handleResize = () => {
      const temperatureData = generateTimeData(timeRange);
      const productionData = generateProductionData(timeRange);
      
      createTemperatureChart(temperatureData);
      createProductionChart(productionData);
      createChinaMap().catch(error => console.error("地图渲染失败:", error));
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [timeRange]);

  return (
    <ProtectedRoute>
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">数据中心</h1>
            <div className="flex gap-4">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <FaDownload />
                导出数据
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <FaFilter />
                筛选
              </button>
            </div>
          </div>

          {/* 数据筛选器 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="flex gap-4 items-center">
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="day">今日</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="year">本年</option>
              </select>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
              >
                <option value="temperature">水温</option>
                <option value="oxygen">溶解氧</option>
                <option value="ph">pH值</option>
                <option value="production">产量</option>
              </select>
              <select
                className="px-4 py-2 border border-gray-300 rounded-lg"
                value={timeRange}
                onChange={(e) => setTimeRange(Number(e.target.value))}
              >
                <option value="3">最近3天</option>
                <option value="7">最近7天</option>
                <option value="14">最近14天</option>
                <option value="30">最近30天</option>
              </select>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索数据..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg pl-10"
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-6">水温趋势</h2>
              <div className="h-[400px] relative">
                <svg ref={temperatureChartRef} className="w-full h-full"></svg>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold mb-6">产量统计</h2>
              <div className="h-[400px] relative">
                <svg ref={productionChartRef} className="w-full h-full"></svg>
              </div>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-6">详细数据</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      日期
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      水温 (°C)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      溶解氧 (mg/L)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      pH值
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(5)].map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        2024-01-{String(index + 1).padStart(2, '0')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(23 + Math.random()).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(7 + Math.random()).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(7.5 + Math.random() * 0.5).toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          正常
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 中国地图可视化 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-6">地区分布</h2>
            <div className="h-[500px] relative">
              <svg ref={chinaMapRef} className="w-full h-full"></svg>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
