// 图表下载工具函数

/**
 * 通用文件下载函数
 * @param url 文件URL或数据URL
 * @param filename 文件名
 */
const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // 如果是blob URL，需要释放内存
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Chart.js图表下载
 * @param chartRef Chart.js图表引用
 * @param filename 文件名（不含扩展名）
 * @param format 下载格式
 */
export const downloadChart = (
  chartRef: any,
  filename: string,
  format: 'png' | 'pdf' | 'svg' = 'png'
) => {
  if (chartRef.current) {
    const canvas = chartRef.current.canvas;
    const url = canvas.toDataURL('image/png');
    downloadFile(url, `${filename}.${format}`);
  }
};

/**
 * D3.js SVG图表下载
 * @param svgRef SVG元素引用
 * @param filename 文件名（不含扩展名）
 */
export const downloadD3Chart = (
  svgRef: React.RefObject<SVGSVGElement>,
  filename: string
) => {
  const svgElement = svgRef.current;
  if (svgElement) {
    // 克隆SVG元素以避免修改原始元素
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    
    // 添加必要的样式和命名空间
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    // 获取计算样式并内联到SVG中
    const styles = getComputedStyle(svgElement);
    clonedSvg.style.cssText = styles.cssText;
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    downloadFile(URL.createObjectURL(blob), `${filename}.svg`);
  }
};

/**
 * 通过选择器下载D3图表
 * @param selector SVG选择器
 * @param filename 文件名（不含扩展名）
 */
export const downloadD3ChartBySelector = (
  selector: string,
  filename: string
) => {
  const svgElement = document.querySelector(selector) as SVGSVGElement;
  if (svgElement) {
    const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
    
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    downloadFile(URL.createObjectURL(blob), `${filename}.svg`);
  }
};

/**
 * 下载CSV数据
 * @param data 数据数组
 * @param filename 文件名（不含扩展名）
 * @param headers 表头（可选）
 */
export const downloadCSV = (
  data: any[],
  filename: string,
  headers?: string[]
) => {
  if (!data || data.length === 0) {
    console.warn('没有数据可下载');
    return;
  }

  let csvContent = '';
  
  // 添加表头
  if (headers) {
    csvContent += headers.join(',') + '\n';
  } else if (data[0] && typeof data[0] === 'object') {
    // 如果没有提供表头，使用第一个对象的键作为表头
    csvContent += Object.keys(data[0]).join(',') + '\n';
  }
  
  // 添加数据行
  data.forEach(row => {
    if (typeof row === 'object') {
      const values = Object.values(row).map(value => {
        // 处理包含逗号或引号的值
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvContent += values.join(',') + '\n';
    } else {
      csvContent += String(row) + '\n';
    }
  });
  
  // 添加BOM以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(URL.createObjectURL(blob), `${filename}.csv`);
};

/**
 * 下载JSON数据
 * @param data 数据对象
 * @param filename 文件名（不含扩展名）
 */
export const downloadJSON = (
  data: any,
  filename: string
) => {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadFile(URL.createObjectURL(blob), `${filename}.json`);
};

/**
 * 获取当前时间戳字符串（用于文件名）
 */
export const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
};