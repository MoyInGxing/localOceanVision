'use client';

import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { FaDownload, FaFilter, FaSearch, FaFileExport, FaUpload, FaChartLine } from 'react-icons/fa';
import { downloadD3Chart, downloadCSV, getTimestamp } from '../../utils/chartDownload';

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

// 定义上传的鱼类体长-时间数据类型
interface FishGrowthData {
  id?: string;
  species_name: string;
  time_point: number; // 时间点（天数或月数）
  length: number; // 体长（cm）
  upload_date?: Date;
}

// 定义预测结果类型
interface GrowthPrediction {
  time_point: number;
  predicted_length: number;
  confidence_interval?: [number, number];
}

export default function SpeciesAnalysis() {
  console.log("SpeciesAnalysis组件开始渲染");
  
  const [speciesData, setSpeciesData] = useState<SpeciesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [lengthFilter, setLengthFilter] = useState('');
  const [showAllSpecies, setShowAllSpecies] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState('all');
  const [selectedLengthRange, setSelectedLengthRange] = useState('all');
  
  // --- 新增：数据上传和预测相关状态 ---
  const [uploadedData, setUploadedData] = useState<FishGrowthData[]>([]);
  const [predictionResults, setPredictionResults] = useState<GrowthPrediction[]>([]);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [selectedUploadSpecies, setSelectedUploadSpecies] = useState<string>('');
  const [showUploadSection, setShowUploadSection] = useState(false);
  const [showPredictionSection, setShowPredictionSection] = useState(false);
  
  // 引用DOM元素
  const speciesChartRef = useRef<SVGSVGElement | null>(null);
  const speciesLengthChartRef = useRef<SVGSVGElement | null>(null);
  const predictionChartRef = useRef<SVGSVGElement | null>(null);
  
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
            // 暂停token验证: 'Authorization': `Bearer ${token}`
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

    // 使用筛选后的数据
    const filteredData = speciesData.filter(species => {
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
    });

    // 创建X轴比例尺
    const x = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.length1) || 0])
      .range([0, width]);

    // 创建Y轴比例尺
    const y = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.weight) || 0])
      .range([height, 0]);

    // 创建颜色比例尺
    const colorScale = d3.scaleOrdinal<string>()
      .domain(filteredData.map(d => d.species_name))
      .range(d3.schemeCategory10);

    // 创建大小比例尺
    const sizeScale = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.weight / 30 + d.length1) || 0])
      .range([5, 15]);

    // 添加X轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom<number>(x).ticks(5).tickFormat((d: number) => `${d}cm`))
      .style("font-size", "12px");

    // 添加Y轴
    svg.append("g")
      .call(d3.axisLeft<number>(y).ticks(5).tickFormat((d: number) => `${d}g`))
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
      .data(filteredData)
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

    const uniqueSpecies = Array.from(new Set(filteredData.map(d => d.species_name)));
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
  }, [speciesData, selectedSpecies, selectedLengthRange]); // 添加依赖项

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
      .domain([0, (d3.max(speciesData, d => d.length1) ?? 0) * 1.1])
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
  }, [speciesData]);

  // 创建预测结果图表
  useEffect(() => {
    if (!predictionChartRef.current || predictionResults.length === 0) return;

    // 清除现有图表
    d3.select(predictionChartRef.current).selectAll("*").remove();

    // 设置图表尺寸和边距
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // 创建SVG
    const svg = d3.select(predictionChartRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 合并实际数据和预测数据
    const actualData = uploadedData.filter(d => d.species_name === selectedUploadSpecies);
    const allData = [...actualData.map(d => ({ time_point: d.time_point, length: d.length, type: 'actual' })),
                    ...predictionResults.map(d => ({ time_point: d.time_point, length: d.predicted_length, type: 'predicted' }))];

    // 创建比例尺
    const xScale = d3.scaleLinear()
      .domain(d3.extent(allData, d => d.time_point) as [number, number])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain(d3.extent(allData, d => d.length) as [number, number])
      .range([height, 0]);

    // 添加X轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom<number>(xScale).tickFormat((d: number) => `${d}天`))
      .style("font-size", "12px");

    // 添加Y轴
    svg.append("g")
      .call(d3.axisLeft<number>(yScale).tickFormat((d: number) => `${d}cm`))
      .style("font-size", "12px");

    // 添加实际数据点
    svg.selectAll(".actual-point")
      .data(actualData)
      .enter()
      .append("circle")
      .attr("class", "actual-point")
      .attr("cx", d => xScale(d.time_point))
      .attr("cy", d => yScale(d.length))
      .attr("r", 5)
      .attr("fill", "#3b82f6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    // 添加预测数据点
    svg.selectAll(".predicted-point")
      .data(predictionResults)
      .enter()
      .append("circle")
      .attr("class", "predicted-point")
      .attr("cx", d => xScale(d.time_point))
      .attr("cy", d => yScale(d.predicted_length))
      .attr("r", 4)
      .attr("fill", "#ef4444")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // 添加预测线
    const line = d3.line<GrowthPrediction>()
      .x(d => xScale(d.time_point))
      .y(d => yScale(d.predicted_length))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(predictionResults)
      .attr("fill", "none")
      .attr("stroke", "#ef4444")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("d", line);

    // 添加标题
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text(`${selectedUploadSpecies} 体长增长预测`);

    // 添加图例
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width - 120}, 30)`);

    const legendItems = [
      { color: "#3b82f6", label: "实际数据", type: "circle" },
      { color: "#ef4444", label: "预测数据", type: "line" }
    ];

    legendItems.forEach((item, i) => {
      const g = legend.append("g")
        .attr("transform", `translate(0, ${i * 20})`);

      if (item.type === "circle") {
        g.append("circle")
          .attr("cx", 8)
          .attr("cy", 0)
          .attr("r", 4)
          .attr("fill", item.color);
      } else {
        g.append("line")
          .attr("x1", 0)
          .attr("x2", 16)
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("stroke", item.color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "5,5");
      }

      g.append("text")
        .attr("x", 25)
        .attr("y", 4)
        .style("font-size", "12px")
        .style("fill", "#4a5568")
        .text(item.label);
    });
  }, [predictionResults, uploadedData, selectedUploadSpecies]);

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

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const data: FishGrowthData[] = [];

      // 解析CSV文件（假设格式：species_name,time_point,length）
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const [species_name, time_point, length] = line.split(',');
          if (species_name && time_point && length) {
            data.push({
              species_name: species_name.trim(),
              time_point: parseFloat(time_point.trim()),
              length: parseFloat(length.trim()),
              upload_date: new Date()
            });
          }
        }
      }

      // 保存到数据库（模拟API调用）
      const response = await fetch('/api/fish-growth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setUploadedData(data);
        alert(`成功上传 ${data.length} 条数据！`);
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      console.error('文件上传错误:', error);
      alert('文件上传失败，请检查文件格式');
    } finally {
      setUploadLoading(false);
    }
  };

  // 执行体长预测
  const performGrowthPrediction = async () => {
    if (uploadedData.length === 0) {
      alert('请先上传数据');
      return;
    }

    setPredictionLoading(true);
    try {
      // 简单的线性回归预测模型
      const speciesData = uploadedData.filter(d => d.species_name === selectedUploadSpecies);
      if (speciesData.length < 2) {
        alert('数据点不足，无法进行预测');
        return;
      }

      // 计算线性回归参数
      const n = speciesData.length;
      const sumX = speciesData.reduce((sum, d) => sum + d.time_point, 0);
      const sumY = speciesData.reduce((sum, d) => sum + d.length, 0);
      const sumXY = speciesData.reduce((sum, d) => sum + d.time_point * d.length, 0);
      const sumXX = speciesData.reduce((sum, d) => sum + d.time_point * d.time_point, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // 生成预测数据
      const maxTime = Math.max(...speciesData.map(d => d.time_point));
      const predictions: GrowthPrediction[] = [];

      for (let t = maxTime + 1; t <= maxTime + 30; t++) {
        const predictedLength = slope * t + intercept;
        predictions.push({
          time_point: t,
          predicted_length: Math.max(0, predictedLength), // 确保预测值不为负
          confidence_interval: [predictedLength * 0.9, predictedLength * 1.1]
        });
      }

      setPredictionResults(predictions);
      alert('预测完成！');
    } catch (error) {
      console.error('预测失败:', error);
      alert('预测失败，请重试');
    } finally {
      setPredictionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载物种数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ 加载失败</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">物种数据分析</h1>
            <p className="text-gray-600">深入分析海洋物种数据，预测生长趋势</p>
          </div>

          {/* 数据上传和预测功能区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 数据上传区域 */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">数据上传</h3>
                <button
                  onClick={() => setShowUploadSection(!showUploadSection)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FaUpload className="inline mr-1" />
                  {showUploadSection ? '收起' : '展开'}
                </button>
              </div>
              
              {showUploadSection && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      上传鱼类体长-时间数据 (CSV格式)
                    </label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={uploadLoading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      文件格式：species_name,time_point,length
                    </p>
                  </div>
                  
                  {uploadLoading && (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-sm text-gray-600">正在上传...</p>
                    </div>
                  )}
                  
                  {uploadedData.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">上传成功！</h4>
                      <p className="text-sm text-green-700">
                        共上传 {uploadedData.length} 条数据，包含 {Array.from(new Set(uploadedData.map(d => d.species_name))).length} 个物种
                      </p>
                      <div className="mt-2">
                        <h5 className="text-sm font-medium text-green-800">物种列表：</h5>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {Array.from(new Set(uploadedData.map(d => d.species_name))).map(species => (
                            <span key={species} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {species}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 预测功能区域 */}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">体长预测</h3>
                <button
                  onClick={() => setShowPredictionSection(!showPredictionSection)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaChartLine className="inline mr-1" />
                  {showPredictionSection ? '收起' : '展开'}
                </button>
              </div>
              
              {showPredictionSection && (
                <div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择预测物种
                    </label>
                    <select
                      value={selectedUploadSpecies}
                      onChange={(e) => setSelectedUploadSpecies(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={uploadedData.length === 0}
                    >
                      <option value="">请选择物种</option>
                      {Array.from(new Set(uploadedData.map(d => d.species_name))).map(species => (
                        <option key={species} value={species}>{species}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={performGrowthPrediction}
                      disabled={!selectedUploadSpecies || predictionLoading}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {predictionLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                          预测中...
                        </>
                      ) : (
                        <>
                          <FaChartLine className="inline mr-1" />
                          开始预测
                        </>
                      )}
                    </button>
                    
                    {predictionResults.length > 0 && (
                      <button
                        onClick={() => {
                          const csvData = predictionResults.map(p => 
                            `${p.time_point},${p.predicted_length.toFixed(2)}`
                          ).join('\n');
                          const blob = new Blob(['time_point,predicted_length\n' + csvData], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `${selectedUploadSpecies}_prediction_${getTimestamp()}.csv`;
                          link.click();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FaDownload className="inline mr-1" />
                        导出结果
                      </button>
                    )}
                  </div>

                  {predictionResults.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-4">预测结果图表</h4>
                      <div className="h-[400px] relative">
                        <svg 
                          ref={predictionChartRef} 
                          className="w-full h-full"
                          style={{ border: '1px solid #eee' }}
                        ></svg>
                      </div>
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                        <h5 className="font-medium mb-2">预测统计信息</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">数据点数：</span>
                            <span className="font-medium">{uploadedData.filter(d => d.species_name === selectedUploadSpecies).length}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">预测点数：</span>
                            <span className="font-medium">{predictionResults.length}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">最大预测体长：</span>
                            <span className="font-medium">{Math.max(...predictionResults.map(p => p.predicted_length)).toFixed(2)} cm</span>
                          </div>
                          <div>
                            <span className="text-gray-600">预测时间范围：</span>
                            <span className="font-medium">{Math.max(...predictionResults.map(p => p.time_point))} 天</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 物种筛选器 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">物种筛选</label>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  value={selectedSpecies}
                  onChange={(e) => setSelectedSpecies(e.target.value)}
                >
                  <option value="all">全部物种</option>
                  {uniqueSpecies.map(species => (
                    <option key={species} value={species}>{species}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">体长范围</label>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                  value={selectedLengthRange}
                  onChange={(e) => setSelectedLengthRange(e.target.value)}
                >
                  {lengthRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="搜索物种..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg pl-10"
                    value={speciesFilter}
                    onChange={(e) => setSpeciesFilter(e.target.value)}
                  />
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <FaFileExport className="inline mr-1" />
                导出CSV
              </button>
            </div>
          </div>

          {/* 物种数据图表 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">物种体长-体重关系</h2>
                <button
                  onClick={() => downloadD3Chart(speciesChartRef, '物种体长体重关系图')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <FaDownload className="inline mr-1" />
                  下载
                </button>
              </div>
              <div className="h-[400px] relative">
                <svg 
                  ref={speciesChartRef} 
                  className="w-full h-full"
                  style={{ border: '1px solid #eee' }}
                ></svg>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">物种体长分布</h2>
                <button
                  onClick={() => downloadD3Chart(speciesLengthChartRef, '物种体长分布图')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  <FaDownload className="inline mr-1" />
                  下载
                </button>
              </div>
              <div className="h-[400px] relative">
                <svg 
                  ref={speciesLengthChartRef} 
                  className="w-full h-full"
                  style={{ border: '1px solid #eee' }}
                ></svg>
              </div>
            </div>
          </div>

          {/* 物种数据表格 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">物种详细数据</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAllSpecies(!showAllSpecies)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {showAllSpecies ? '显示前5条' : '显示全部'}
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FaFileExport className="inline mr-1" />
                  导出数据
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      物种名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      学名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类别
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      体重 (g)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      体长 (cm)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      适宜温度
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSpeciesData.map((species, index) => (
                    <tr key={species.species_id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {species.species_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 italic">
                        {species.scientific_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {species.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {species.weight}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {species.length1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {species.optimal_temp_range}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm text-gray-500">
              显示 {filteredSpeciesData.length} 条记录，共 {speciesData.length} 条
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}