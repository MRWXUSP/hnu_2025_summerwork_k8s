import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  BarChart2,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Activity,
  ExternalLink
} from 'lucide-react';

const ResourceMonitor = ({ isOpen, onClose, nodes }) => {
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 默认10秒
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'CPU_PERCENT',
    direction: 'desc'
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showNodeDetail, setShowNodeDetail] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodePorts, setNodePorts] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [isSimulated, setIsSimulated] = useState(false); // 添加回isSimulated状态

  // 加载所有保存的节点端口
  useEffect(() => {
    const loadSavedPorts = () => {
      const ports = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('nodePort_')) {
          const nodeIp = key.replace('nodePort_', '');
          ports[nodeIp] = localStorage.getItem(key);
        }
      }
      setNodePorts(ports);
    };
    
    loadSavedPorts();
    setLastUpdated(new Date());
  }, []);

  // 处理自动刷新
  useEffect(() => {
    let intervalId;
    
    if (autoRefresh && isOpen) {
      intervalId = setInterval(() => {
        setLastUpdated(new Date());
      }, refreshInterval);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, isOpen]);

  // 排序处理
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 应用排序和搜索过滤
  const getFilteredAndSortedItems = () => {
    let items = nodes || [];
    
    // 搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item => {
        return (
          item.NAME?.toLowerCase().includes(term) ||
          item.STATUS?.toLowerCase().includes(term) ||
          item.ROLES?.toLowerCase().includes(term)
        );
      });
    }
    
    // 排序
    if (sortConfig.key) {
      items = [...items].sort((a, b) => {
        if (a[sortConfig.key] === undefined) return 1;
        if (b[sortConfig.key] === undefined) return -1;
        
        const aValue = typeof a[sortConfig.key] === 'string' 
          ? a[sortConfig.key].toLowerCase() 
          : a[sortConfig.key];
        const bValue = typeof b[sortConfig.key] === 'string' 
          ? b[sortConfig.key].toLowerCase() 
          : b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return items;
  };

  // 获取排序指示器
  const getSortIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
    }
    return null;
  };

  // 渲染进度条
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


  // 获取节点实时资源使用情况
  const fetchNodeResourceUsage = useCallback(async (nodeIp, port) => {
    try {
      const response = await fetch(`/get-resource-usage?ip=${encodeURIComponent(nodeIp)}&port=${port}`);
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        return {
          cpu: data.data.cpu,
          memory: data.data.memory
        };
      }
      return null;
    } catch (error) {
      console.error(`获取节点 ${nodeIp} 资源使用情况失败:`, error);
      return null;
    }
  }, []);

  // 处理节点端口保存
  const handleSaveNodePort = (nodeIp, port) => {
    const newNodePorts = { ...nodePorts, [nodeIp]: port };
    localStorage.setItem(`nodePort_${nodeIp}`, port);
    setNodePorts(newNodePorts);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {showNodeDetail && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-3xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Activity className="w-6 h-6 mr-2 text-blue-600" />
                {selectedNode.NAME} 资源监控
              </h2>
              <button
                onClick={() => setShowNodeDetail(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 overflow-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">节点信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">内部IP</div>
                    <div className="font-medium">{selectedNode['INTERNAL-IP']}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">状态</div>
                    <div className="font-medium">{selectedNode.STATUS}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">角色</div>
                    <div className="font-medium">{selectedNode.ROLES || '-'}</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-500">Kubernetes版本</div>
                    <div className="font-medium">{selectedNode.VERSION}</div>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">资源监控</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">CPU使用率</div>
                      <div className="text-sm font-medium">{selectedNode.CPU_PERCENT?.toFixed(1)}%</div>
                    </div>
                    {renderProgressBar(selectedNode.CPU_PERCENT)}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <div className="text-sm font-medium">内存使用率</div>
                      <div className="text-sm font-medium">{selectedNode.MEMORY_PERCENT?.toFixed(1)}%</div>
                    </div>
                    {renderProgressBar(selectedNode.MEMORY_PERCENT)}
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">实时资源监控</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <label htmlFor="nodePort" className="block text-sm font-medium text-gray-700 mr-2">
                        节点API端口:
                      </label>
                      <input
                        type="text"
                        id="nodePort"
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-24 sm:text-sm border-gray-300 rounded-md"
                        placeholder="30081"
                        defaultValue={nodePorts[selectedNode['INTERNAL-IP']] || '30081'}
                      />
                      <button
                        onClick={async () => {
                          const portInput = document.getElementById('nodePort');
                          const port = portInput.value;
                          if (port) {
                            handleSaveNodePort(selectedNode['INTERNAL-IP'], port);
                            const resourceData = await fetchNodeResourceUsage(selectedNode['INTERNAL-IP'], port);
                            if (resourceData) {
                              // 更新选中节点的资源数据
                              setSelectedNode({
                                ...selectedNode,
                                CPU_PERCENT: resourceData.cpu,
                                MEMORY_PERCENT: resourceData.memory
                              });
                            }
                          }
                        }}
                        className="ml-2 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        获取实时数据
                      </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      注意: 需要节点上运行资源监控API服务
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-7xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <BarChart2 className="w-6 h-6 mr-2 text-blue-600" />
            集群资源监控
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isSimulated && (
          <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-yellow-800 text-sm flex items-center">
            <svg className="w-5 h-5 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>
              <strong>注意：</strong> 当前显示的是模拟数据。要获取真实数据，请确保集群中安装了metrics-server。
              <a href="https://github.com/kubernetes-sigs/metrics-server#installation" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline">
                了解更多
              </a>
            </span>
          </div>
        )}

        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* 左侧控制区域 */}
            <div className="flex flex-wrap items-center gap-4">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="搜索节点..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
              </div>
            </div>

            {/* 右侧控制区域 */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoRefresh"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="autoRefresh" className="text-sm font-medium text-gray-700">
                  自动刷新
                </label>
                {autoRefresh && (
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={5000}>5秒</option>
                    <option value={10000}>10秒</option>
                    <option value={30000}>30秒</option>
                    <option value={60000}>1分钟</option>
                  </select>
                )}
              </div>

              <button
                onClick={() => setLastUpdated(new Date())}
                disabled={loading}
                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center text-sm"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-grow overflow-auto">
          {error ? (
            <div className="p-4 m-4 bg-red-100 text-red-800 border-l-4 border-red-500 rounded">
              <p className="font-medium">获取资源使用情况失败</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">加载资源数据中...</span>
            </div>
          ) : (
            <div className="p-4">
              {/* 节点资源表格 */}
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('NAME')}
                    >
                      <div className="flex items-center">
                        节点名称 {getSortIndicator('NAME')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('STATUS')}
                    >
                      <div className="flex items-center">
                        状态 {getSortIndicator('STATUS')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('CPU_PERCENT')}
                    >
                      <div className="flex items-center">
                        CPU使用率 {getSortIndicator('CPU_PERCENT')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('MEMORY_PERCENT')}
                    >
                      <div className="flex items-center">
                        内存使用率 {getSortIndicator('MEMORY_PERCENT')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP地址
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      角色
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredAndSortedItems().map((node, index) => (
                    <tr key={index} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                      setSelectedNode(node);
                      setShowNodeDetail(true);
                    }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900 flex items-center">
                          {node.NAME}
                          <ExternalLink className="w-3 h-3 ml-1 text-gray-400" />
                        </div>
                        <div className="text-xs text-gray-500">{node.VERSION}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          node.STATUS === 'Ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {node.STATUS}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full mr-2">
                            {renderProgressBar(node.CPU_PERCENT)}
                          </div>
                          <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                            {node.CPU_PERCENT?.toFixed(1) || '0.0'}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-full mr-2">
                            {renderProgressBar(node.MEMORY_PERCENT)}
                          </div>
                          <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                            {node.MEMORY_PERCENT?.toFixed(1) || '0.0'}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {node['INTERNAL-IP']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {node.ROLES || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500 flex justify-between">
          <div>
            {`${getFilteredAndSortedItems().length} 个节点`}
            {searchTerm && ` (已过滤)`}
          </div>
          <div>
            {lastUpdated ? `最后更新: ${lastUpdated.toLocaleString()}` : '未更新'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceMonitor;
