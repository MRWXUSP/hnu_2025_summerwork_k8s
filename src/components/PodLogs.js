import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  RefreshCw,
  Download,
  Copy
} from 'lucide-react';

const PodLogs = ({ isOpen, onClose, podName, namespace }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tailLines, setTailLines] = useState(100);
  const [container, setContainer] = useState('');
  const [containers, setContainers] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // 获取Pod日志
  const fetchLogs = useCallback(async () => {
    if (!podName || !namespace) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const url = `/pod-logs?pod_name=${encodeURIComponent(podName)}&namespace=${encodeURIComponent(namespace)}${container ? `&container=${encodeURIComponent(container)}` : ''}&tail_lines=${tailLines}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
        setLogs([]);
      } else {
        setLogs(data.log_lines || []);
        // 如果是第一次加载并且返回了容器名，设置当前容器
        if (!container && data.container) {
          setContainer(data.container);
        }
      }
    } catch (error) {
      setError(`获取日志失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [podName, namespace, container, tailLines]);

  // 获取Pod详情以获取容器列表
  const fetchPodDetails = useCallback(async () => {
    if (!podName || !namespace) return;
    
    try {
      // 这里假设有一个API接口可以获取Pod详情，如果没有，可以修改为使用现有的接口
      // 或者在后端添加一个新的接口
      const response = await fetch(`/pods`);
      const data = await response.json();
      
      // 找到对应的Pod
      const pod = data.pods?.find(p => p.NAME === podName && p.NAMESPACE === namespace);
      if (pod) {
        // 这里需要根据实际API返回的数据结构进行调整
        // 由于我们的API没有返回容器列表，这里暂时使用一个空数组
        setContainers(['default-container']);
      }
    } catch (error) {
      console.error('获取Pod详情失败:', error);
    }
  }, [podName, namespace]);

  // 复制日志到剪贴板
  const copyLogs = () => {
    const logText = logs.join('\n');
    navigator.clipboard.writeText(logText).then(
      () => alert('日志已复制到剪贴板'),
      (err) => alert('复制失败: ' + err)
    );
  };

  // 下载日志
  const downloadLogs = () => {
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${podName}-${namespace}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 组件挂载时获取日志和Pod详情
  useEffect(() => {
    if (isOpen) {
      fetchPodDetails();
      fetchLogs();
    }
  }, [isOpen, podName, namespace, fetchLogs, fetchPodDetails]);

  // 处理自动刷新
  useEffect(() => {
    let intervalId;
    
    if (autoRefresh && isOpen) {
      intervalId = setInterval(fetchLogs, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, isOpen, fetchLogs]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden m-4 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="mr-2">Pod 日志:</span>
            <span className="font-mono text-blue-600">{podName}</span>
            <span className="mx-2 text-gray-400">|</span>
            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
              {namespace}
            </span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap gap-3">
          {/* 控制区域 */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">行数:</label>
            <select
              value={tailLines}
              onChange={(e) => setTailLines(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>

          {containers.length > 0 && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">容器:</label>
              <select
                value={container}
                onChange={(e) => setContainer(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {containers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">自动刷新:</label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600"
            />
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

          <div className="flex-grow"></div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
            <button
              onClick={copyLogs}
              disabled={logs.length === 0}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center text-sm"
            >
              <Copy className="w-4 h-4 mr-1" />
              复制
            </button>
            <button
              onClick={downloadLogs}
              disabled={logs.length === 0}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 flex items-center text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              下载
            </button>
          </div>
        </div>

        {/* 日志内容区域 */}
        <div className="flex-grow overflow-auto p-0 bg-gray-900">
          {error ? (
            <div className="p-4 bg-red-100 text-red-800 border-l-4 border-red-500">
              <p className="font-medium">获取日志失败</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : loading && logs.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-400">加载日志中...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <p>没有可显示的日志</p>
            </div>
          ) : (
            <pre className="p-4 text-green-400 font-mono text-sm whitespace-pre-wrap">
              {logs.map((line, index) => (
                <div key={index} className="py-0.5 hover:bg-gray-800">
                  <span className="text-gray-500 mr-2">{index + 1}</span>
                  {line}
                </div>
              ))}
            </pre>
          )}
        </div>

        <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between">
          <div>总行数: {logs.length}</div>
          <div>
            {loading ? '正在加载...' : `最后更新: ${new Date().toLocaleTimeString()}`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PodLogs;

