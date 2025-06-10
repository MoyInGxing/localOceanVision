'use client';

import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import ProtectedRoute from '../components/ProtectedRoute';
import { FaDownload, FaFilter, FaSearch, FaFileExport, FaExclamationTriangle } from 'react-icons/fa';
import Script from 'next/script';

// 定义数据类型
interface DataPoint {
  date: Date;
  value: number;
}

// 定义水质状态类型
type WaterQualityStatus = 'normal' | 'warning' | 'error';

// 定义水质数据类型
interface WaterQuality {
  temperature: number;
  oxygen: number;
  ph: number;
  turbidity: number;
  status: WaterQualityStatus;
}

// 定义省份数据类型
interface ProvinceFeature {
  type: "Feature";
  properties: {
    name: string;
    waterQuality: WaterQuality;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

// 定义GeoJSON数据类型
interface GeoJSONData {
  type: "FeatureCollection";
  features: ProvinceFeature[];
}

// 定义物种数据类型
interface SpeciesData {
  species_id: string;
  species_name: string;
  scientific_name: string;
  category: string;
  weight: number;
  length1: number;
  length2: number;
  length3: number;
  height: number;
  width: number;
  optimal_temp_range: string;
}

// 定义高德地图相关类型
interface AMapPoint {
  lng: number;
  lat: number;
}

interface LocationData {
  address: string;
  point: AMapPoint;
}

// 扩展Window接口
declare global {
  interface Window {
    AMap: any;
    initAMap: () => void;
  }
}

export default function DataCenter() {
  console.log("DataCenter组件开始渲染");
  
  const [dateRange, setDateRange] = useState('week');
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeRange, setTimeRange] = useState(7); // 默认显示最近7天
  const [isMounted, setIsMounted] = useState(false); // 添加挂载状态
  const [speciesData, setSpeciesData] = useState<SpeciesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [lengthFilter, setLengthFilter] = useState('');
  const [showAllSpecies, setShowAllSpecies] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedLengthRange, setSelectedLengthRange] = useState('all');
  
  // 添加高德地图相关状态
  const [mapLoaded, setMapLoaded] = useState(false);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [mapInstance, setMapInstance] = useState<any>(null);
  
  // 添加流域筛选相关状态
  const [selectedBasin, setSelectedBasin] = useState('上海市-长江流域');
  const [allLocations, setAllLocations] = useState<string[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);

  // --- 新增：报警弹窗相关状态 ---
  const [showAlert, setShowAlert] = useState(false);
  const [alertStatus, setAlertStatus] = useState<WaterQualityStatus>('normal');
  const [alertMessage, setAlertMessage] = useState('');
  
  // 引用DOM元素
  const temperatureChartRef = useRef<SVGSVGElement | null>(null);
  const productionChartRef = useRef<SVGSVGElement | null>(null);
  const chinaMapRef = useRef<SVGSVGElement | null>(null);
  const speciesChartRef = useRef<SVGSVGElement | null>(null);
  const speciesLengthChartRef = useRef<SVGSVGElement | null>(null);
  const amapRef = useRef<HTMLDivElement | null>(null);
  
  // 获取物种数据
  useEffect(() => {
    const fetchSpeciesData = async () => {
      try {
        console.log('开始获取物种数据...');
        const response = await fetch('http://localhost:8080/api/species', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });

        console.log('收到响应:', response.status);
        if (!response.ok) {
          throw new Error(`获取数据失败: ${response.status}`);
        }

        const data = await response.json();
        console.log('获取到的数据:', data);
        setSpeciesData(data);
      } catch (err: any) {
        console.error('获取数据时发生错误:', err);
        setError(err?.message || '获取数据时发生错误');
      } finally {
        setLoading(false);
      }
    };

    fetchSpeciesData();
  }, []);

  // --- 新增：模拟实时水质监测并触发报警 ---
  useEffect(() => {
    const checkWaterQuality = () => {
      // 模拟生成随机水质数据
      // 提高温度和浊度超出正常范围的概率以触发报警
      const temperature = 15 + Math.random() * 20; // 15-35°C
      const ph = 6.5 + Math.random() * 2.5;     // 6.5-9.0
      const oxygen = 2 + Math.random() * 8;       // 2-10mg/L
      const turbidity = 10 + Math.random() * 90;  // 10-100NTU

      const status = getStatus(temperature, ph, oxygen, turbidity);
      console.log(`模拟水质监测: T=${temperature.toFixed(1)}, pH=${ph.toFixed(1)}, O2=${oxygen.toFixed(1)}, Turbidity=${turbidity.toFixed(1)}, Status=${status}`);

      // 如果状态为 'warning' 或 'error' 并且当前没有显示报警，则触发报警
      if ((status === 'warning' || status === 'error') && !showAlert) {
        setAlertStatus(status);
        const messages = [];
        if (temperature > 32 || temperature < 10) messages.push(`温度异常: ${temperature.toFixed(1)}°C`);
        if (ph > 9.5 || ph < 5.5) messages.push(`pH值异常: ${ph.toFixed(1)}`);
        if (oxygen < 2) messages.push(`溶解氧过低: ${oxygen.toFixed(1)}mg/L`);
        if (turbidity > 95) messages.push(`浊度过高: ${turbidity.toFixed(1)}NTU`);
        setAlertMessage(messages.join(', '));
        setShowAlert(true);
      }
    };

    // 每10秒检查一次
    const intervalId = setInterval(checkWaterQuality, 1000);

    // 组件卸载时清除定时器
    return () => clearInterval(intervalId);
  }, [showAlert]); // 依赖showAlert，以便在关闭后可以再次触发

  // 获取所有唯一的物种名称
  const uniqueSpecies = Array.from(new Set(speciesData.map(s => s.species_name)));

  // 定义体长范围选项
  const lengthRanges = [
    { value: 'all', label: '全部体长' },
    { value: '0-10', label: '0-10cm' },
    { value: '10-20', label: '10-20cm' },
    { value: '20-30', label: '20-30cm' },
    { value: '30-40', label: '30-40cm' },
    { value: '40+', label: '40cm以上' }
  ];

  // 创建物种数据图表
  useEffect(() => {
    if (!speciesChartRef.current || speciesData.length === 0) return;

    // 清除现有图表
    d3.select(speciesChartRef.current).selectAll("*").remove();

    // 设置图表尺寸和边距
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const containerWidth = speciesChartRef.current.clientWidth || 800;
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // 创建SVG
    const svg = d3.select(speciesChartRef.current)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${containerWidth} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 创建X轴比例尺
    const x = d3.scaleLinear()
      .domain([0, d3.max(speciesData, d => d.length1) || 0])
      .range([0, width]);

    // 创建Y轴比例尺
    const y = d3.scaleLinear()
      .domain([0, d3.max(speciesData, d => d.weight) || 0])
      .range([height, 0]);

    // 创建颜色比例尺
    const colorScale = d3.scaleOrdinal()
      .domain(speciesData.map(d => d.species_name))
      .range(d3.schemeCategory10);

    // 创建大小比例尺
    const sizeScale = d3.scaleLinear()
      .domain([0, d3.max(speciesData, d => d.weight / 30 + d.length1) || 0])
      .range([5, 15]);

    // 添加X轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d => `${d}cm`))
      .style("font-size", "12px");

    // 添加Y轴
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}g`))
      .style("font-size", "12px");

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

    // 添加散点
    svg.selectAll("circle")
      .data(speciesData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.length1))
      .attr("cy", d => y(d.weight))
      .attr("r", d => sizeScale(d.weight / 30 + d.length1))
      .attr("fill", d => colorScale(d.species_name))
      .attr("opacity", 0.6)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // 添加标题
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .style("fill", "#1a365d")
      .text("鱼类体长-体重分布关系图");

    // 添加副标题
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#4a5568")
      .text("注：点的大小表示综合指标(体重/30 + 体长)");

    // 添加X轴标签
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#4a5568")
      .text("体长 (cm)");

    // 添加Y轴标签
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 20)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#4a5568")
      .text("体重 (g)");

    // 添加图例
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 120}, 30)`);

    // 添加图例标题
    legend.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .style("fill", "#4a5568")
      .text("物种图例");

    const uniqueSpecies = Array.from(new Set(speciesData.map(d => d.species_name)));
    uniqueSpecies.forEach((species, i) => {
      const legendRow = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      legendRow.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 6)
        .attr("fill", colorScale(species))
        .attr("opacity", 0.6);

      legendRow.append("text")
        .attr("x", 15)
        .attr("y", 4)
        .style("font-size", "12px")
        .style("fill", "#4a5568")
        .text(species);
    });

    // 添加交互提示
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px");

    svg.selectAll("circle")
      .on("mouseover", function(event: any, d: any) {
        const species = d as SpeciesData;
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 1)
          .attr("stroke-width", 2);

        tooltip
          .style("visibility", "visible")
          .html(`
            <div class="font-bold mb-1">${species.species_name}</div>
            <div>体重: ${species.weight}g</div>
            <div>体长: ${species.length1}cm</div>
            <div>类别: ${species.category}</div>
            <div>适宜温度: ${species.optimal_temp_range}</div>
          `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.6)
          .attr("stroke-width", 1);
        tooltip.style("visibility", "hidden");
      });
  }, [speciesData]);

  // 创建物种体长分布图
  useEffect(() => {
    if (!speciesLengthChartRef.current || speciesData.length === 0) return;

    // 清除现有图表
    d3.select(speciesLengthChartRef.current).selectAll("*").remove();

    // 设置图表尺寸和边距
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // 创建SVG
    const svg = d3.select(speciesLengthChartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 创建X轴比例尺
    const x = d3.scaleBand()
      .domain(speciesData.map(d => d.species_name))
      .range([0, width])
      .padding(0.2);

    // 创建Y轴比例尺
    const y = d3.scaleLinear()
      .domain([0, d3.max(speciesData, d => d.length1) * 1.1 || 0])
      .range([height, 0]);

    // 添加渐变
    const gradient = svg.append("defs")
      .append("linearGradient")
      .attr("id", "length-bar-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#4cc9f0");

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#4895ef");

    // 添加X轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", "12px");

    // 添加Y轴
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}cm`))
      .style("font-size", "12px");

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

    // 添加柱状图
    svg.selectAll(".bar")
      .data(speciesData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.species_name) || 0)
      .attr("y", height)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", "url(#length-bar-gradient)")
      .attr("rx", 4)
      .attr("ry", 4)
      .transition()
      .duration(800)
      .attr("y", d => y(d.length1))
      .attr("height", d => height - y(d.length1));

    // 添加数值标签
    svg.selectAll(".label")
      .data(speciesData)
      .enter()
      .append("text")
      .attr("class", "label")
      .attr("x", d => (x(d.species_name) || 0) + x.bandwidth() / 2)
      .attr("y", d => y(d.length1) - 5)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("fill", "#666")
      .text(d => `${d.length1}cm`);

    // 添加标题
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("物种体长分布");

    // 添加交互提示
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px");

    svg.selectAll(".bar")
      .on("mouseover", function(event: any, d: any) {
        const species = d as SpeciesData;
        d3.select(this)
          .transition()
          .duration(200)
          .attr("opacity", 0.8);

        tooltip
          .style("visibility", "visible")
          .html(`
            <div class="font-bold mb-1">${species.species_name}</div>
            <div>体长: ${species.length1}cm</div>
            <div>体重: ${species.weight}g</div>
            <div>类别: ${species.category}</div>
            <div>适宜温度: ${species.optimal_temp_range}</div>
          `)
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
  }, [speciesData]);

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
  
  // 添加组件挂载效果
  useEffect(() => {
    console.log("DataCenter组件开始挂载...");
    setIsMounted(true);
    return () => {
      console.log("DataCenter组件开始卸载...");
      setIsMounted(false);
    };
  }, []);

  // 初始化图表
  useEffect(() => {
    if (!isMounted) {
      console.log("组件未挂载，跳过初始化");
      return;
    }

    console.log("组件已挂载，开始初始化...");
    console.log("图表引用状态:", {
      temperatureChart: temperatureChartRef.current,
      productionChart: productionChartRef.current,
      chinaMap: chinaMapRef.current
    });

    const temperatureData = generateTimeData(timeRange);
    const productionData = generateProductionData(timeRange);
    
    createTemperatureChart(temperatureData);
    createProductionChart(productionData);
    createChinaMap().catch(error => console.error("地图渲染失败:", error));
  }, [isMounted]); // 只依赖isMounted

  // 当时间范围或指标变化时重新渲染图表
  useEffect(() => {
    if (!isMounted) return;

    console.log("时间范围或指标变化，重新渲染图表");
    const temperatureData = generateTimeData(timeRange);
    const productionData = generateProductionData(timeRange);
    
    createTemperatureChart(temperatureData);
    createProductionChart(productionData);
    createChinaMap().catch(error => console.error("地图渲染失败:", error));
    
    // 清理函数
    return () => {
      d3.selectAll(".tooltip").remove();
    };
  }, [timeRange, dateRange, selectedMetric]); // 只依赖这些状态
  
  // 根据水质指标判断状态
  function getStatus(temperature: number, ph: number, oxygen: number, turbidity: number): WaterQualityStatus {
    // 设置更合理的阈值
    if (isNaN(temperature) || isNaN(ph) || isNaN(oxygen) || isNaN(turbidity)) {
      return "warning";
    }
    
    // 异常状态阈值 - 更严格的条件
    if (temperature > 32 || temperature < 10 || 
        ph > 9.5 || ph < 5.5 || 
        oxygen < 2 || 
        turbidity > 95) {
      return "error";
    }
    
    // 警告状态阈值 - 更严格的条件
    if (temperature > 30 || temperature < 12 || 
        ph > 9.0 || ph < 6.0 || 
        oxygen < 3 || 
        turbidity > 85) {
      return "warning";
    }
    
    return "normal";
  }

  // 创建中国地图可视化
  const createChinaMap = async () => {
    console.log("开始创建中国地图...");
    if (!chinaMapRef.current) {
      console.log("地图容器不存在，跳过地图创建");
      return;
    }
    
    // 清除之前的图表
    d3.select(chinaMapRef.current).selectAll("*").remove();
    
    // 设置地图尺寸和边距
    const width = chinaMapRef.current.clientWidth;
    const height = 500;
    console.log("地图尺寸:", { width, height });
    
    // 创建SVG
    const svg = d3.select(chinaMapRef.current)
      .attr("width", width)
      .attr("height", height);
    
    try {
      // 添加背景
      svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#f8fafc");

      // 添加标题
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("中国海洋养殖区域分布");

      // 添加说明文字
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "#666")
        .text("正在加载地图数据...");

      console.log("开始加载GeoJSON数据...");
      
      // 加载所有省份的GeoJSON数据
      const provinceFiles = [
        "110000", "120000", "130000", "140000", "150000",
        "210000", "220000", "230000", "310000", "320000",
        "330000", "340000", "350000", "360000", "370000",
        "410000", "420000", "430000", "440000", "450000",
        "460000", "500000", "510000", "520000", "530000",
        "540000", "610000", "620000", "630000", "640000",
        "650000", "710000", "810000", "820000"
      ];

      const features = [];
      for (const code of provinceFiles) {
        try {
          const response = await fetch(`/geojson_full/province/${code}.json`);
          if (!response.ok) {
            console.warn(`无法加载省份 ${code} 的数据`);
            continue;
          }
          const data = await response.json();
          if (data && data.features) {
            features.push(...data.features);
          }
        } catch (error) {
          console.warn(`加载省份 ${code} 数据时出错:`, error);
        }
      }

      const geoData = {
        type: "FeatureCollection",
        features: features
      };

      if (!geoData || !geoData.features || !Array.isArray(geoData.features)) {
        throw new Error("GeoJSON数据格式不正确");
      }
      console.log("GeoJSON数据加载成功，特征数量:", geoData.features.length);

      // 定义投影
      const projection = d3.geoMercator()
        .center([105, 38])
        .scale(800)
        .translate([width / 2, height / 2]);

      // 创建路径生成器
      const pathGenerator = d3.geoPath().projection(projection);

      // 绘制地图路径
      const mapGroup = svg.append("g").attr("class", "map-group");

      // 生成模拟数据
      const generateProvinceData = () => {
        return geoData.features.map(feature => ({
          name: feature.properties.name,
          temperature: 15 + Math.random() * 15, // 15-30°C
          ph: 6.5 + Math.random() * 2.5, // 6.5-9.0
          oxygen: 3 + Math.random() * 7, // 3-10mg/L
          turbidity: 10 + Math.random() * 90 // 10-100NTU
        }));
      };

      const provinceData = generateProvinceData();
      console.log("生成省份数据:", provinceData);

      // 定义状态颜色映射
      const statusColors: Record<WaterQualityStatus, string> = {
        normal: "#4361ee",
        warning: "#f59e0b",
        error: "#ef4444"
      };

      // 绘制省份边界
      const paths = mapGroup.selectAll("path")
        .data(geoData.features)
        .enter()
        .append("path")
        .attr("class", "province")
        .attr("d", (d: any) => {
          const path = pathGenerator(d);
          if (!path) {
            console.warn(`省份 ${d.properties?.name} 的路径生成失败`);
            return "";
          }
          return path;
        })
        .attr("fill", (d: any) => {
          const province = provinceData.find(p => p.name === d.properties.name);
          if (!province) return "#ccc";
          const status = getStatus(
            province.temperature,
            province.ph,
            province.oxygen,
            province.turbidity
          );
          return statusColors[status];
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.8)
        .on("mouseover", function(event, d) {
          const province = provinceData.find(p => p.name === d.properties.name);
          if (province) {
            d3.select(this)
              .attr("opacity", 1)
              .attr("stroke-width", 1);

            // 显示详细信息
            const tooltip = d3.select("body").append("div")
              .attr("class", "tooltip")
              .style("position", "absolute")
              .style("visibility", "visible")
              .style("background-color", "rgba(0, 0, 0, 0.8)")
              .style("color", "white")
              .style("padding", "8px")
              .style("border-radius", "4px")
              .style("font-size", "12px")
              .style("pointer-events", "none")
              .html(`
                <div>${d.properties.name}</div>
                <div>温度: ${province.temperature.toFixed(1)}°C</div>
                <div>pH值: ${province.ph.toFixed(1)}</div>
                <div>溶解氧: ${province.oxygen.toFixed(1)}mg/L</div>
                <div>浊度: ${province.turbidity.toFixed(1)}NTU</div>
              `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
          }
        })
        .on("mouseout", function() {
          d3.select(this)
            .attr("opacity", 0.8)
            .attr("stroke-width", 0.5);
          d3.selectAll(".tooltip").remove();
        });

      console.log("地图绘制完成，共绘制", paths.size(), "个省份");

      // 移除加载提示
      svg.selectAll("text.loading-text").remove();

      // 添加图例
      const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, ${height - 100})`);

      // 添加图例标题
      legend.append("text")
        .attr("class", "legend-title")
        .attr("x", 0)
        .attr("y", -10)
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("图例");

      // 添加图例项
      const legendItems = [
        { color: "#4361ee", label: "正常区域" },
        { color: "#f59e0b", label: "警告区域" },
        { color: "#ef4444", label: "异常区域" }
      ];

      legendItems.forEach((item, i) => {
        const g = legend.append("g")
          .attr("transform", `translate(0, ${i * 20})`);

        g.append("rect")
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", item.color)
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);

        g.append("text")
          .attr("class", "legend-text")
          .attr("x", 25)
          .attr("y", 12)
          .style("font-size", "12px")
          .text(item.label);
      });

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

  // 筛选物种数据
  const filteredSpeciesData = speciesData
    .filter(species => {
      // 物种筛选
      const matchesSpecies = selectedSpecies === 'all' || species.species_name === selectedSpecies;
      
      // 体长范围筛选
      let matchesLength = true;
      if (selectedLengthRange !== 'all') {
        const length = species.length1;
        switch (selectedLengthRange) {
          case '0-10':
            matchesLength = length >= 0 && length < 10;
            break;
          case '10-20':
            matchesLength = length >= 10 && length < 20;
            break;
          case '20-30':
            matchesLength = length >= 20 && length < 30;
            break;
          case '30-40':
            matchesLength = length >= 30 && length < 40;
            break;
          case '40+':
            matchesLength = length >= 40;
            break;
        }
      }
      
      return matchesSpecies && matchesLength;
    })
    .slice(0, showAllSpecies ? undefined : 5);

  // 添加导出CSV功能
  const exportToCSV = () => {
    // 准备CSV数据
    const headers = ['物种名称', '类别', '体重(g)', '体长(cm)', '适宜温度范围'];
    const csvData = filteredSpeciesData.map(species => [
      species.species_name,
      species.category,
      species.weight,
      species.length1,
      species.optimal_temp_range
    ]);

    // 创建CSV内容
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    // 创建Blob对象
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // 创建下载链接
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `物种数据_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 地理编码服务函数
  const geocodeAddress = async (address: string): Promise<AMapPoint | null> => {
    try {
      // 解析地址格式：省份-流域-具体位置
      const [province, basin, location] = address.split('-');
      
      // 构建更完整的地址
      const formattedAddress = `${province}${location}`;
      console.log('正在解析地址:', formattedAddress);
      
      const response = await fetch(
        `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(formattedAddress)}&key=96cdd7a8bceea5f8dc25a2d8c32c98b8&city=${province}`
      );
      
      const result = await response.json();
      console.log('地理编码结果:', result);
      
      if (result.status === '1' && result.geocodes && result.geocodes.length > 0) {
        const location = result.geocodes[0].location.split(',');
        console.log('解析成功，坐标:', location);
        return {
          lng: parseFloat(location[0]),
          lat: parseFloat(location[1])
        };
      } else {
        // 如果第一次解析失败，尝试使用更简化的地址
        console.log('尝试使用简化地址:', location);
        const fallbackResponse = await fetch(
          `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(location)}&key=96cdd7a8bceea5f8dc25a2d8c32c98b8&city=${province}`
        );
        
        const fallbackResult = await fallbackResponse.json();
        console.log('简化地址解析结果:', fallbackResult);
        
        if (fallbackResult.status === '1' && fallbackResult.geocodes && fallbackResult.geocodes.length > 0) {
          const location = fallbackResult.geocodes[0].location.split(',');
          console.log('简化地址解析成功，坐标:', location);
          return {
            lng: parseFloat(location[0]),
            lat: parseFloat(location[1])
          };
        }
      }
      
      console.error(`无法解析地址: ${formattedAddress}`);
      return null;
    } catch (error) {
      console.error('地理编码请求失败:', error);
      return null;
    }
  };

  // 添加位置点到地图
  const addLocationsToMap = async (addresses: string[]) => {
    if (!mapInstance) {
      console.error('地图实例未初始化');
      return;
    }

    // 清除现有标记
    mapInstance.clearMap();
    
    console.log('开始添加位置点:', addresses);
    const newLocations: LocationData[] = [];
    
    for (const address of addresses) {
      console.log('处理地址:', address);
      const point = await geocodeAddress(address);
      if (point) {
        console.log('添加标记点:', point);
        newLocations.push({ address, point });
        
        // 创建标记
        const marker = new window.AMap.Marker({
          position: [point.lng, point.lat],
          title: address.split('-')[2], // 只显示具体位置名称
          animation: 'AMAP_ANIMATION_DROP',
          offset: new window.AMap.Pixel(-13, -30)
        });

        // 创建信息窗体
        const infoWindow = new window.AMap.InfoWindow({
          content: `<div class="p-2">
            <h3 class="font-bold">${address.split('-')[2]}</h3>
            <p>经度: ${point.lng.toFixed(6)}</p>
            <p>纬度: ${point.lat.toFixed(6)}</p>
          </div>`,
          offset: new window.AMap.Pixel(0, -30)
        });

        // 绑定点击事件
        marker.on('click', () => {
          infoWindow.open(mapInstance, marker.getPosition());
        });

        mapInstance.add(marker);
      }
    }

    setLocations(newLocations);
  };

  // 示例：添加位置
  useEffect(() => {
    if (mapLoaded && filteredLocations.length > 0) {
      console.log('地图已加载，开始添加位置点');
      addLocationsToMap(filteredLocations);
    }
  }, [mapLoaded, filteredLocations]);

  // 初始化高德地图
  const initAMap = () => {
    if (!amapRef.current || !window.AMap) return;

    const map = new window.AMap.Map(amapRef.current, {
      zoom: 11,
      center: [121.4737, 31.2304], // 上海市中心坐标
      viewMode: '3D'
    });

    // 加载所有需要的插件
    window.AMap.plugin([
      'AMap.Scale',
      'AMap.ToolBar',
      'AMap.Geocoder',
      'AMap.InfoWindow'
    ], () => {
      // 添加地图控件
      map.addControl(new window.AMap.Scale());
      map.addControl(new window.AMap.ToolBar({
        position: 'RB'
      }));
    });

    setMapInstance(map);
  };

  // 加载高德地图API
  useEffect(() => {
    const loadAMap = () => {
      if (window.AMap) {
        setMapLoaded(true);
        initAMap();
      }
    };

    if (typeof window !== 'undefined') {
      if (window.AMap) {
        loadAMap();
      } else {
        window.initAMap = loadAMap;
      }
    }
  }, []);

  // 在useEffect中加载位置数据
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const response = await fetch('/dataset/all_location.txt');
        const text = await response.text();
        const locations = text.split('\n').filter(line => line.trim());
        setAllLocations(locations);
        
        // 默认显示上海的长江流域数据
        const defaultLocations = locations.filter(loc => loc.startsWith('上海市-长江流域'));
        setFilteredLocations(defaultLocations);
      } catch (error) {
        console.error('加载位置数据失败:', error);
      }
    };
    
    loadLocations();
  }, []);

  // 处理流域选择变化
  const handleBasinChange = (basin: string) => {
    setSelectedBasin(basin);
    const filtered = allLocations.filter(loc => loc.startsWith(basin));
    setFilteredLocations(filtered);
  };

  // 获取所有唯一的流域
  const uniqueBasins = Array.from(new Set(allLocations.map(loc => {
    const parts = loc.split('-');
    return parts.slice(0, 2).join('-');
  })));

  return (
    <ProtectedRoute>
      <main className="p-8">
        {/* --- 报警弹窗的JSX渲染 (按钮颜色已更新) --- */}
        {showAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full mx-4 transform transition-all duration-300 ease-out ${showAlert ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
              <div className="flex items-start">
                <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${alertStatus === 'error' ? 'bg-red-100' : 'bg-yellow-100'} sm:mx-0 sm:h-10 sm:w-10`}>
                  <FaExclamationTriangle className={`${alertStatus === 'error' ? 'text-red-600' : 'text-yellow-600'} h-6 w-6`} />
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                    {alertStatus === 'error' ? '水质异常报警' : '水质警告'}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      检测到水质指标出现异常，请立即检查并处理。
                    </p>
                    <p className="text-sm text-red-600 font-semibold mt-2">
                      异常详情: {alertMessage}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowAlert(false)}
                >
                  我知道了
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 添加高德地图API脚本 */}
        <Script
          src={`https://webapi.amap.com/maps?v=2.0&key=96cdd7a8bceea5f8dc25a2d8c32c98b8&callback=initAMap`}
          strategy="afterInteractive"
        />
        
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

          {/* 物种数据筛选器 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="space-y-4">
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    选择物种
                    <span className="text-gray-500 text-xs ml-1">(选择特定物种查看详细数据)</span>
                  </label>
                  <select
                    value={selectedSpecies}
                    onChange={(e) => setSelectedSpecies(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">所有物种</option>
                    {uniqueSpecies.map(species => (
                      <option key={species} value={species}>
                        {species}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    体长范围
                    <span className="text-gray-500 text-xs ml-1">(按体长范围筛选数据)</span>
                  </label>
                  <select
                    value={selectedLengthRange}
                    onChange={(e) => setSelectedLengthRange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {lengthRanges.map(range => (
                      <option key={range.value} value={range.value}>
                        {range.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end mt-4 relative z-10 gap-4">
                <button
                  onClick={exportToCSV}
                  className="inline-flex items-center px-6 py-2.5 bg-white text-gray-900 text-base font-bold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 shadow-md border border-gray-200"
                  style={{ position: 'relative', zIndex: 20 }}
                >
                  <FaFileExport className="mr-2" />
                  <span className="tracking-wide">导出数据</span>
                </button>
                <button
                  onClick={() => setShowAllSpecies(!showAllSpecies)}
                  className="inline-flex items-center px-6 py-2.5 bg-white text-gray-900 text-base font-bold rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 shadow-md border border-gray-200"
                  style={{ position: 'relative', zIndex: 20 }}
                >
                  <span className="mr-2 tracking-wide">{showAllSpecies ? '收起数据' : '显示全部数据'}</span>
                  <svg 
                    className={`w-5 h-5 transform transition-transform duration-200 ${showAllSpecies ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-500 mt-4">
                <p>提示：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>选择"所有物种"可查看所有数据</li>
                  <li>选择特定物种可查看该物种的详细数据</li>
                  <li>体长范围可帮助您筛选特定大小的物种</li>
                  <li>默认显示前5条数据，点击"显示全部数据"可查看完整数据</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 物种数据部分 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-6">物种数据分析</h2>
            <div className="w-full h-[500px]">
              <svg ref={speciesChartRef} className="w-full h-full"></svg>
            </div>
          </div>

          {/* 物种数据表格 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-6">物种详细数据</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物种名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类别</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">体重(g)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">体长(cm)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">适宜温度范围</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSpeciesData.map((species, index) => (
                    <tr key={`species-${species.species_id}-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.species_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.weight}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.length1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.optimal_temp_range}</td>
                    </tr>

                  ))}
                </tbody>
              </table>
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
                  {Array.from({ length: 5 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    return (
                      <tr key={`water-data-${date.toISOString()}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {date.toLocaleDateString('zh-CN')}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 中国地图可视化 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-6">地区分布</h2>
            <div className="h-[500px] relative">
              <svg 
                ref={chinaMapRef} 
                className="w-full h-full"
                style={{ border: '1px solid #eee' }}
              ></svg>
            </div>
          </div>

          {/* 添加高德地图容器 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-6">地理位置分布</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择流域
              </label>
              <select
                value={selectedBasin}
                onChange={(e) => handleBasinChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {uniqueBasins.map(basin => (
                  <option key={basin} value={basin}>
                    {basin}
                  </option>
                ))}
              </select>
            </div>
            <div 
              ref={amapRef} 
              className="w-full h-[500px]"
              style={{ border: '1px solid #eee' }}
            ></div>
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">当前流域监测点列表：</h3>
              <div className="max-h-[300px] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredLocations.map((location, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="font-medium text-gray-900">{location.split('-')[2]}</div>
                      <div className="text-sm text-gray-500">{location.split('-')[0]}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                共 {filteredLocations.length} 个监测点
              </div>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}