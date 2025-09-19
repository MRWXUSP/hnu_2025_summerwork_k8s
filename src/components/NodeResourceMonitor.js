import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Cpu, 
  HardDrive, 
  X
} from 'lucide-react';
import { ensureValidPort, parsePort } from '../utils/portUtils';

const NodeResourceMonitor = ({ isOpen, onClose, nodeIp }) => {
  // 从本地存储中获取该节点上次使用的端口号，如果没有则使用默认值
  const [port, setPort] = useState(() => {
    const savedPort = localStorage.getItem(`nodePort_${nodeIp}`);
    // 确保端口号有效
    return ensureValidPort(savedPort, '30081'); // 默认端口
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // 获取节点资源使用情况
  const fetchResourceUsage = useCallback(async () => {
    if (!nodeIp || !port) {
      setError('请提供节点IP和端口号');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 确保端口号有效
      const validPort = ensureValidPort(port);
      const portNum = parsePort(validPort);
      if (!portNum) {
        throw new Error(`端口号无效: ${port}`);
      }
      
      // 使用修复后的端口号
      console.log(`获取资源使用情况使用端口: ${portNum}`);
      const response = await fetch(`/get-resource-usage?ip=${encodeURIComponent(nodeIp)}&port=${portNum}`);
      const data = await response.json();

      if (data.status === 'success' && data.data) {
        // 保存验证过的端口号到本地存储，并发布一个自定义事件通知其他组件
        localStorage.setItem(`nodePort_${nodeIp}`, validPort);
        // 触发一个自定义事件，通知其他组件端口号已更新
        const event = new CustomEvent('nodePortUpdated', { 
          detail: { nodeIp, port: validPort } 
        });
        window.dispatchEvent(event);
        
        // 处理返回格式 - cpu和memory都是直接的百分比值(0-100)
        const formattedData = {
          // CPU信息
          cpu_percent: data.data.cpu, // 已经是百分比值(0-100)
          cpu_count: 2, // 设置为2核
          
          // 内存信息
          memory_percent: data.data.memory, // 已经是百分比值(0-100)
          memory_total: 4 * 1024 * 1024 * 1024, // 设置为4GB
          memory_used: (data.data.memory / 100) * (4 * 1024 * 1024 * 1024), // 根据百分比计算
          memory_available: (1 - data.data.memory / 100) * (4 * 1024 * 1024 * 1024),
          
          // 磁盘信息（使用默认值）
          disk_percent: 0,
          disk_total: 0,
          disk_used: 0,
          disk_free: 0
        };
        
        setResourceData(formattedData);
        setLastUpdated(new Date());
      } else {
        setError(data.error || '获取资源使用情况失败');
      }
    } catch (error) {
      setError(`请求失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [nodeIp, port]);

  // 组件挂载时获取资源使用情况
  useEffect(() => {
    if (isOpen && nodeIp) {
      fetchResourceUsage();
    }
  }, [isOpen, nodeIp, fetchResourceUsage]);

  // 处理自动刷新
  useEffect(() => {
    let intervalId;
    
    if (autoRefresh && isOpen) {
      intervalId = setInterval(fetchResourceUsage, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, isOpen, nodeIp, port, fetchResourceUsage]);

  // 渲染资源使用进度条
  const renderProgressBar = (percent) => {
    let color = 'bg-green-500';
    if (percent > 80) {
      color = 'bg-red-500';
    } else if (percent > 60) {
      color = 'bg-yellow-500';
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden m-4 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Activity className="w-6 h-6 mr-2 text-blue-600" />
            节点资源监控
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-grow">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">节点IP</label>
                  <input
                    type="text"
                    value={nodeIp}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API端口</label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="端口号"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-end space-x-2">
              <button
                onClick={fetchResourceUsage}
                disabled={loading || !nodeIp || !port}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600 mr-2"
            />
            <label htmlFor="autoRefresh" className="text-sm font-medium text-gray-700 mr-4">
              自动刷新
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={2000}>2秒</option>
                <option value={5000}>5秒</option>
                <option value={10000}>10秒</option>
                <option value={30000}>30秒</option>
              </select>
            )}
          </div>
        </div>

        <div className="flex-grow overflow-auto p-6">
          {error ? (
            <div className="p-4 bg-red-100 text-red-800 border-l-4 border-red-500 rounded">
              <p className="font-medium">获取资源使用情况失败</p>
              <p className="text-sm">{error}</p>
              <div className="mt-2 text-sm">
                <p>请确认:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>节点上的API服务是否正在运行</li>
                  <li>端口号是否正确</li>
                  <li>网络连接是否正常</li>
                </ul>
              </div>
            </div>
          ) : loading && !resourceData ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">加载资源数据中...</span>
            </div>
          ) : resourceData ? (
            <div className="space-y-6">
              {/* CPU使用情况 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center mb-2">
                  <Cpu className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">CPU使用情况</h3>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-full mr-2">
                    {renderProgressBar(resourceData.cpu_percent || 0)}
                  </div>
                  <div className="text-lg font-medium text-gray-900 whitespace-nowrap">
                    {(resourceData.cpu_percent || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">CPU核心数</div>
                    <div className="text-lg font-semibold">{resourceData.cpu_count || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">平均负载</div>
                    <div className="text-lg font-semibold">
                      {resourceData.load_avg ? resourceData.load_avg.join(' / ') : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 内存使用情况 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center mb-2">
                  <HardDrive className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">内存使用情况</h3>
                </div>
                <div className="flex items-center mb-2">
                  <div className="w-full mr-2">
                    {renderProgressBar(resourceData.memory_percent || 0)}
                  </div>
                  <div className="text-lg font-medium text-gray-900 whitespace-nowrap">
                    {(resourceData.memory_percent || 0).toFixed(1)}%
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">总内存</div>
                    <div className="text-lg font-semibold">
                      {resourceData.memory_total ? 
                        ((resourceData.memory_total || 0) / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : 
                        'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">已使用</div>
                    <div className="text-lg font-semibold">
                      {resourceData.memory_used ? 
                        ((resourceData.memory_used || 0) / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : 
                        'N/A'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">可用</div>
                    <div className="text-lg font-semibold">
                      {resourceData.memory_available ? 
                        ((resourceData.memory_available || 0) / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : 
                        'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {/* API响应信息 */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center mb-2">
                  <HardDrive className="w-5 h-5 text-purple-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">原始API响应</h3>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
                  <pre className="whitespace-pre-wrap">
                    {`{
  "status": "success",
  "data": {
    "cpu": ${resourceData.cpu_percent || 0},
    "memory": ${resourceData.memory_percent || 0}
  }
}`}
                  </pre>
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  <p>注意：API返回的CPU和内存值都是百分比（如40表示40%，23.7表示23.7%）</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Activity className="w-12 h-12 text-gray-400 mb-2" />
              <p>请输入节点API端口并点击刷新按钮</p>
              <p className="text-sm mt-2">默认端口通常为30081</p>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between">
          <div>
            节点: {nodeIp}
          </div>
          <div>
            {lastUpdated ? `最后更新: ${lastUpdated.toLocaleString()}` : '未更新'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeResourceMonitor;
