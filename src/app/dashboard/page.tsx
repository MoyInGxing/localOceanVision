'use client';

import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import ProtectedRoute from '../components/ProtectedRoute';
import { downloadD3Chart, downloadCSV, getTimestamp } from '../../utils/chartDownload';
import { FaDownload, FaFileExport } from 'react-icons/fa';

interface TemperatureData {
  time: string;
  value: number;
}

export default function Dashboard() {
  const [temperatureData, setTemperatureData] = useState<TemperatureData[]>([]);
  const [timeRange, setTimeRange] = useState(24); // 默认显示最近24小时
  const svgRef = useRef<SVGSVGElement>(null);

  // 生成时间标签和数据
  const generateTimeData = (range: number): TemperatureData[] => {
    const data: TemperatureData[] = [];
    const now = new Date();
    
    for (let i = range - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setHours(date.getHours() - i);
      const timeStr = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
      
      // 生成随机温度数据 (0-40°C范围)
      const rawValue = Math.random() * 40;
      data.push({
        time: timeStr,
        value: rawValue
      });
    }
    
    // 使用移动平均平滑数据
    return data.map((item, index, array) => {
      const start = Math.max(0, index - 2);
      const end = Math.min(array.length, index + 3);
      const slice = array.slice(start, end);
      const smoothedValue = slice.reduce((a, b) => a + b.value, 0) / slice.length;
      
      return {
        time: item.time,
        value: smoothedValue
      };
    });
  };

  // 创建D3图表
  const createChart = () => {
    if (!svgRef.current || temperatureData.length === 0) return;

    // 清除之前的图表
    d3.select(svgRef.current).selectAll("*").remove();

    // 设置图表尺寸和边距
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };
    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // 创建SVG元素
    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 创建X轴比例尺
    const x = d3.scaleBand()
      .domain(temperatureData.map(d => d.time))
      .range([0, width])
      .padding(0.1);

    // 创建Y轴比例尺 - 固定范围为0-40°C，便于颜色区间划分
    const y = d3.scaleLinear()
      .domain([0, 40]) // 固定温度范围为0-40°C
      .range([height, 0]);

    // 创建线条生成器
    const line = d3.line<TemperatureData>()
      .x(d => (x(d.time) as number) + x.bandwidth() / 2)
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX); // 使用平滑曲线

    // 添加X轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickValues(
        x.domain().filter((_, i) => i % Math.ceil(temperatureData.length / 8) === 0)
      ))
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    // 添加Y轴 - 每10°C一个刻度
    svg.append("g")
      .call(d3.axisLeft(y).tickValues([0, 10, 20, 30, 40]).tickFormat(d => `${d}°C`));
      
    // 创建温度区间的颜色比例尺
    const colorScale = d3.scaleThreshold<number, string>()
      .domain([10, 20, 30])
      .range(["#0000ff", "#00cc00", "#ffcc00", "#ff0000"]);
      
    // 为每个温度区间添加背景色
    const tempRanges = [0, 10, 20, 30, 40];
    for (let i = 0; i < tempRanges.length - 1; i++) {
      svg.append("rect")
        .attr("x", 0)
        .attr("y", y(tempRanges[i+1]))
        .attr("width", width)
        .attr("height", y(tempRanges[i]) - y(tempRanges[i+1]))
        .attr("fill", colorScale(tempRanges[i]))
        .attr("opacity", 0.1);
    }

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

    // 创建线性渐变定义
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "temperature-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", y(0))
      .attr("x2", 0)
      .attr("y2", y(40));
      
    // 添加渐变色停止点
    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#0000ff"); // 蓝色 - 极低温
      
    gradient.append("stop")
      .attr("offset", "25%")
      .attr("stop-color", "#00cc00"); // 绿色 - 低温
      
    gradient.append("stop")
      .attr("offset", "50%")
      .attr("stop-color", "#ffcc00"); // 黄色 - 中温
      
    gradient.append("stop")
      .attr("offset", "75%")
      .attr("stop-color", "#ff9900"); // 橙色 - 高温
      
    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#ff0000"); // 红色 - 极高温
    
    // 添加线条路径 - 使用渐变色
    svg.append("path")
      .datum(temperatureData)
      .attr("fill", "none")
      .attr("stroke", "url(#temperature-gradient)")
      .attr("stroke-width", 2)
      .attr("d", line);

    // 添加数据点 - 根据温度值设置颜色
    svg.selectAll(".dot")
      .data(temperatureData)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => (x(d.time) as number) + x.bandwidth() / 2)
      .attr("cy", d => y(d.value))
      .attr("r", 3)
      .attr("fill", d => colorScale(d.value));
      
    // 添加图例
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 120}, 10)`);
      
    const legendItems = [
      { color: "#0000ff", label: "0-10°C" },
      { color: "#00cc00", label: "10-20°C" },
      { color: "#ffcc00", label: "20-30°C" },
      { color: "#ff0000", label: "30-40°C" }
    ];
    
    legendItems.forEach((item, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);
        
      legendRow.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", item.color);
        
      legendRow.append("text")
        .attr("x", 15)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .style("font-size", "12px")
        .text(item.label);
    });

    // 添加交互提示
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // 添加鼠标悬停交互
    svg.selectAll(".dot")
      .on("mouseover", (event, d) => {
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
        tooltip.html(`温度: ${(d as TemperatureData).value.toFixed(1)}°C<br/>时间: ${(d as TemperatureData).time}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });
  };

  // 生成数据并创建图表
  useEffect(() => {
    const data = generateTimeData(timeRange);
    setTemperatureData(data);
  }, [timeRange]);

  // 当数据或窗口大小变化时重新渲染图表
  useEffect(() => {
    createChart();
    
    // 添加窗口大小变化监听
    const handleResize = () => {
      createChart();
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      // 清除tooltip
      d3.select(".tooltip").remove();
    };
  }, [temperatureData]);

  return (
    <ProtectedRoute>
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">主要信息</h1>
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg"
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
            >
              <option value="6">最近6小时</option>
              <option value="12">最近12小时</option>
              <option value="24">最近24小时</option>
              <option value="48">最近48小时</option>
            </select>
          </div>
          
          {/* 实时监控卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MonitorCard title="水温" value="23.5°C" status="normal" />
            <MonitorCard title="溶解氧" value="7.2mg/L" status="warning" />
            <MonitorCard title="pH值" value="7.5" status="normal" />
            <MonitorCard title="盐度" value="35‰" status="normal" />
          </div>

          {/* 图表区域 - 使用D3.js */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">温度趋势</h2>
            </div>
            <div className="h-[400px] w-full relative">
              {/* 图表下载按钮 - 右上角 */}
              <div className="absolute top-4 right-4 flex space-x-2 z-10">
                <button
                  onClick={() => {
                    const timestamp = getTimestamp();
                    downloadD3Chart(
                      svgRef,
                      `温度趋势_${timeRange}_${timestamp}`
                    );
                  }}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg text-sm"
                  title="下载图表"
                >
                  <FaDownload className="w-3 h-3" />
                  <span className="hidden sm:inline">下载</span>
                </button>
                <button
                  onClick={() => {
                    const timestamp = getTimestamp();
                    downloadCSV(
                      temperatureData,
                      `温度数据_${timeRange}_${timestamp}`,
                      ['时间', '温度(°C)']
                    );
                  }}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg text-sm"
                  title="导出数据"
                >
                  <FaFileExport className="w-3 h-3" />
                  <span className="hidden sm:inline">导出</span>
                </button>
              </div>
              <svg ref={svgRef} width="100%" height="400"></svg>
            </div>
          </div>

          {/* 告警信息 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-4">最近告警</h2>
            <div className="space-y-4">
              <AlertItem
                type="warning"
                message="溶解氧水平低于阈值"
                time="10分钟前"
              />
              <AlertItem
                type="info"
                message="日常水质检测完成"
                time="1小时前"
              />
              <AlertItem
                type="success"
                message="投喂系统运行正常"
                time="2小时前"
              />
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}

function MonitorCard({ title, value, status }: { title: string; value: string; status: 'normal' | 'warning' | 'error' }) {
  const statusColors = {
    normal: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <div className="text-3xl font-bold text-gray-700 mb-2">{value}</div>
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statusColors[status]}`}>
        {status === 'normal' ? '正常' : status === 'warning' ? '警告' : '错误'}
      </div>
    </div>
  );
}

function AlertItem({ type, message, time }: { type: 'warning' | 'info' | 'success'; message: string; time: string }) {
  const typeColors = {
    warning: 'text-yellow-700 bg-yellow-50',
    info: 'text-blue-700 bg-blue-50',
    success: 'text-green-700 bg-green-50'
  };

  return (
    <div className={`p-4 rounded-lg ${typeColors[type]}`}>
      <div className="flex justify-between items-center">
        <span>{message}</span>
        <span className="text-sm opacity-70">{time}</span>
      </div>
    </div>
  );
}
