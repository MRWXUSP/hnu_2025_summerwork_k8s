import React from 'react';
import { Cpu, Database } from 'lucide-react';

const TopNodesResourceChart = ({ nodes }) => {
  // 只显示前三个节点
  const topNodes = nodes.slice(0, 3);
  
  // 渲染进度条
  const renderProgressBar = (percent, type) => {
    let color = 'bg-green-500';
    if (percent > 80) {
      color = 'bg-red-500';
    } else if (percent > 60) {
      color = 'bg-yellow-500';
    } else if (type === 'cpu') {
      color = 'bg-blue-500';
    } else if (type === 'memory') {
      color = 'bg-purple-500';
    }
    
    return (
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className={`h-2.5 rounded-full ${color}`} 
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        ></div>
      </div>
    );
  };

  // 如果没有节点数据，显示提示信息
  if (!topNodes || topNodes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6">
        <div className="text-center text-gray-500">
          <p>没有可用的节点数据</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-6 animate-fadeIn">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">节点资源概览</h2>
      <div className="grid grid-cols-1 gap-6">
        {topNodes.map((node, index) => {
          // 确保CPU和内存百分比是有效的数字
          const cpuPercent = typeof node.CPU_PERCENT === 'number' ? node.CPU_PERCENT : 0;
          const memoryPercent = typeof node.MEMORY_PERCENT === 'number' ? node.MEMORY_PERCENT : 0;
          
          return (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-2">
                <div className="font-medium text-gray-900">{node.NAME}</div>
                <div className="text-sm text-gray-500">{node.STATUS}</div>
              </div>
              
              {/* CPU使用情况 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center text-sm text-gray-700">
                    <Cpu className="w-4 h-4 mr-1 text-blue-600" />
                    CPU
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {cpuPercent.toFixed(1)}%
                  </div>
                </div>
                {renderProgressBar(cpuPercent, 'cpu')}
              </div>
              
              {/* 内存使用情况 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center text-sm text-gray-700">
                    <Database className="w-4 h-4 mr-1 text-purple-600" />
                    内存
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {memoryPercent.toFixed(1)}%
                  </div>
                </div>
                {renderProgressBar(memoryPercent, 'memory')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TopNodesResourceChart;

