'use client';

import { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import ProtectedRoute from '../components/ProtectedRoute';
import { FaDownload, FaFilter } from 'react-icons/fa';

interface SpeciesData {
  species_id: number;
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

export default function SpeciesPage() {
  const [speciesData, setSpeciesData] = useState<SpeciesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const chartRef = useRef<SVGSVGElement>(null);

  // 获取数据
  useEffect(() => {
    const fetchData = async () => {
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

    fetchData();
  }, []);

  // 创建图表
  useEffect(() => {
    if (!chartRef.current || speciesData.length === 0) return;

    // 清除现有图表
    d3.select(chartRef.current).selectAll("*").remove();

    // 设置图表尺寸和边距
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // 创建SVG
    const svg = d3.select(chartRef.current)
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
      .domain([0, d3.max(speciesData, d => d.weight) || 0])
      .range([height, 0]);

    // 添加X轴
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    // 添加Y轴
    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}g`));

    // 添加柱状图
    svg.selectAll(".bar")
      .data(speciesData)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.species_name) || 0)
      .attr("y", d => y(d.weight))
      .attr("width", x.bandwidth())
      .attr("height", d => height - y(d.weight))
      .attr("fill", "#4361ee")
      .attr("rx", 4)
      .attr("ry", 4);

    // 添加标题
    svg.append("text")
      .attr("x", width / 2)
      .attr("y", -10)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("物种体重分布");

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
          .html(`物种: ${species.species_name}<br/>体重: ${species.weight}g`)
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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-600">错误: {error}</div>
    </div>
  );

  return (
    <ProtectedRoute>
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">物种数据分析</h1>
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

          {/* 图表区域 */}
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-6">物种体重分布</h2>
            <div className="overflow-x-auto">
              <svg ref={chartRef}></svg>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold mb-6">详细数据</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物种名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">学名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类别</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">体重(g)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">长度1(cm)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">长度2(cm)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">长度3(cm)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">高度(cm)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">宽度(cm)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">适宜温度范围</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {speciesData.map((species) => (
                    <tr key={species.species_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.species_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.scientific_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.weight}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.length1}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.length2}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.length3}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.height}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.width}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{species.optimal_temp_range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
} 