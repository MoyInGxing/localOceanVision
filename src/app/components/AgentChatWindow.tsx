// src/components/AgentChatWindow.tsx

'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaSpinner } from 'react-icons/fa';

// 定义单条消息的接口
interface Message {
  sender: 'user' | 'ai';
  text: string;
}

// 模拟的 AI 模型 API 调用
// 重要提示：在实际项目中，您应该调用一个后端接口，
// 由后端再去请求大模型API，以保护您的API密钥。
const fetchAIResponse = async (userInput: string): Promise<string> => {
  console.log("向AI发送请求:", userInput);
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 模拟基于输入的简单回复
  if (userInput.includes("水质")) {
    return "当然，关于水质，请问您想了解pH值、溶解氧、还是氨氮的具体数据？我可以为您查询最近24小时的变化趋势。";
  } else if (userInput.includes("饲料")) {
    return "根据我们的数据分析，'策略B (优化)' 的饲料转化率（FCR）目前是最佳的，为1.3。建议您采用此策略以降低成本并提高效益。";
  } else if (userInput.includes("疾病")) {
    return "目前系统监测到的主要疾病风险是弧菌病（30%概率）和烂鳃病（25%概率）。建议加强水体消毒，并密切观察鱼群的活动状态。";
  } else {
    return "您好！我是您的专属养殖AI助手。您可以向我提问关于生长预测、疾病预警、投喂优化或环境评估的任何问题。";
  }
};


// 真实场景下的API调用示例 (需要您在项目中创建对应的后端API路由)
const fetchAIResponseReal = async (userInput: string): Promise<string> => {
    try {
      const response = await fetch('/api/chat', { // 目标是后端的 /api/chat 路由
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: userInput }), // 请求体与 Go handler 中的 ChatRequest 结构体匹配
      });
  
      // --- 增强的错误处理 ---
      // 如果响应状态码不是 2xx (e.g., 400, 401, 500)
      if (!response.ok) {
        let errorMessage = `API 错误: ${response.status} ${response.statusText}`;
        
        // 尝试从响应体中解析后端返回的、更具体的 JSON 错误信息
        try {
          const errorData = await response.json();
          // 如果后端返回了 { "error": "具体错误信息" } 格式的数据，我们就使用它
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (jsonError) {
          // 如果错误响应不是一个有效的JSON（例如，服务器崩溃返回了HTML错误页），
          // 我们就保持使用原始的 HTTP 状态文本作为错误信息。
          console.error("无法解析错误响应的JSON:", jsonError);
        }
        
        // 抛出这个更具体的错误，它将被下面的 catch 块捕获
        throw new Error(errorMessage);
      }
  
      // --- 处理成功响应 ---
      const data = await response.json();
  
      // 健壮性检查：确保 'reply' 字段存在且为字符串
      if (typeof data.reply !== 'string') {
          throw new Error("API响应格式不正确，缺少'reply'字段。");
      }
      
      // 返回 Go handler 封装的 AI 回答
      return data.reply; 
  
    } catch (error: any) { // 使用 'any' 或 'unknown' 以遵循 TypeScript 最佳实践
      // 在开发者控制台打印详细的错误信息，便于调试
      console.error("调用AI模型API失败:", error.message);
      
      // 向用户显示一个统一、友好的错误提示
      // 注意：error.message 现在包含了来自后端的具体错误，对调试非常有价值！
      return "抱歉，连接AI助手时遇到问题，请稍后再试。";
      
      /* 或者，你也可以选择直接向用户展示后端的错误信息（可能对管理员更友好）:
         return `出错了: ${error.message}`;
      */
    }
  };



export default function AgentChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'ai', text: '您好！我是您的养殖AI助手，随时可以回答您的问题。' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 效果：当新消息出现时，自动滚动到底部
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 在这里调用API
      const aiResponseText = await fetchAIResponseReal(inputValue); 
      // 若使用真实API，请替换为: const aiResponseText = await fetchAIResponseReal(inputValue);
      
      const aiMessage: Message = { sender: 'ai', text: aiResponseText };
      setMessages(prev => [...prev, aiMessage]);

    } catch (error) {
        const errorMessage: Message = { sender: 'ai', text: '抱歉，我暂时无法回答。请稍后再试。' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">AI 智能助手</h2>
      <div className="h-200 bg-gray-50 rounded-lg p-4 overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'ai' && (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-gray-800 font-bold flex-shrink-0">A</div>
            )}
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-gray-800' : 'bg-gray-200 text-gray-800'}`}>
              <p className="text-sm">{msg.text}</p>
            </div>
             {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold flex-shrink-0">您</div>
            )}
          </div>
        ))}
        {isLoading && (
            <div className="flex items-start gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-gray-800 font-bold flex-shrink-0">A</div>
                <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-gray-200 text-gray-800">
                    <FaSpinner className="animate-spin text-gray-500" />
                </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="请输入您的问题..."
          className="flex-grow p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition flex items-center justify-center"
          disabled={isLoading || !inputValue.trim()}
          aria-label="发送消息"
        >
          {isLoading ? <FaSpinner className="animate-spin" /> : <FaPaperPlane />}
        </button>
      </form>
    </div>
  );
}