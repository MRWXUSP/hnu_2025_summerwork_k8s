import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, 
  Cpu, 
  Container, 
  Upload, 
  RefreshCw, 
  Home,
  Network,
  Database,
  Terminal,
  Folder,
  CheckCircle,
  Square,
  Trash2,
  FileText,
  Activity,
  Download,
  File,
  ChevronRight,
  Save
} from 'lucide-react';

// 导入新组件
import DockerImagesView from './components/DockerImages';
import ServicesView from './components/Services';
import JobCreator from './components/JobCreator';
import PodLogs from './components/PodLogs';
import ResourceMonitor from './components/ResourceMonitor';
import NodeResourceMonitor from './components/NodeResourceMonitor';
import TopNodesResourceChart from './components/TopNodesResourceChart';
import TerminalExecutor from './components/TerminalExecutor';
import FileBrowser from './components/FileBrowser';
import FolderDownloader from './components/FolderDownloader';
import DeploymentsView from './components/Deployments';

// 基础UI组件
const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "" }) => (
  <div className={`p-6 border-b border-gray-100 ${className}`}>
    {children}
  </div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const Button = ({ children, variant = "primary", size = "md", className = "", disabled = false, ...props }) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-blue-500"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
  <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
    {...props}
  >
    {children}
  </button>
);
};

const Input = ({ className = "", ...props }) => (
  <input
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
    {...props}
  />
);

const Select = ({ children, className = "", ...props }) => (
  <select
    className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800"
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

// 仪表板组件
const Dashboard = ({ clusters, nodes, pods, services, onCreateJob, onOpenMonitor, onOpenTerminal }) => {
  // 清理缓存状态
  const [clearCacheSuccess, setClearCacheSuccess] = useState(false);
  
  // 清理本地缓存中的端口映射
  const handleClearCache = () => {
    try {
      // 获取所有localStorage中的键
      const keys = Object.keys(localStorage);
      
      // 过滤出与端口映射相关的键
      const portMappingKeys = keys.filter(key => key.startsWith('nodePort_'));
      
      if (portMappingKeys.length === 0) {
        alert('没有找到缓存的端口映射');
        return;
      }
      
      // 确认是否清理
      if (window.confirm(`确定要清理 ${portMappingKeys.length} 个端口映射缓存吗？`)) {
        // 删除所有端口映射
        portMappingKeys.forEach(key => {
          localStorage.removeItem(key);
        });
        
        // 显示成功提示
        setClearCacheSuccess(true);
        
        // 3秒后隐藏提示
        setTimeout(() => {
          setClearCacheSuccess(false);
        }, 3000);
      }
    } catch (error) {
      alert('清理缓存失败: ' + error.message);
    }
  };
  
  const stats = [
    { label: '集群数量', value: clusters.length, icon: Server, color: 'blue' },
    { label: '节点数量', value: nodes.length, icon: Cpu, color: 'green' },
    { label: 'Pod数量', value: pods.length, icon: Container, color: 'purple' },
    { label: '服务数量', value: services.length, icon: Network, color: 'orange' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold text-gray-900 mr-4">Volcano K8s 管理平台</h1>
          {clearCacheSuccess && (
            <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm">缓存已清理</span>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm" onClick={handleClearCache}>
            <Trash2 className="w-4 h-4 mr-1" />
            清理端口缓存
          </Button>
          <Button variant="outline" size="sm" onClick={onOpenMonitor}>
            <Activity className="w-4 h-4 mr-1" />
            资源监控
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-xl transition-shadow duration-300">
            <CardContent className="flex items-center p-6">
              <div className={`flex-shrink-0 p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">快速操作</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="p-4 h-auto flex-col" onClick={onCreateJob}>
              <Upload className="w-8 h-8 mb-2" />
              <span>创建 Volcano 任务</span>
            </Button>
            <Button variant="secondary" className="p-4 h-auto flex-col" onClick={onOpenMonitor}>
              <Activity className="w-8 h-8 mb-2" />
              <span>资源监控</span>
            </Button>
            <Button variant="outline" className="p-4 h-auto flex-col" onClick={onOpenTerminal}>
              <Terminal className="w-8 h-8 mb-2" />
              <span>执行命令</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// 集群管理组件
const ClustersView = ({ clusters, activeCluster, onClusterChange }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">集群管理</h1>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">Kubernetes 集群</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">选择活动集群</label>
            <Select value={activeCluster} onChange={(e) => onClusterChange(e.target.value)}>
              <option value="">选择集群...</option>
              {clusters.map((cluster) => (
                <option key={cluster} value={cluster}>
                  {cluster}
              </option>
            ))}
            </Select>
          </div>
          
          {activeCluster && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-green-800 font-medium">当前活动集群: {activeCluster}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// 节点管理组件
const NodesView = ({ nodes, onNodeSelect }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [nodesWithPerformance, setNodesWithPerformance] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // 默认30秒
  
  // 使用记录的端口号获取节点性能数据
  const fetchNodePerformance = useCallback(async (nodeIp) => {
    try {
      // 从localStorage获取该节点的端口号
      const port = localStorage.getItem(`nodePort_${nodeIp}`);
      
      // 如果没有保存的端口号，则跳过
      if (!port) {
        return null;
      }
      
      // 调用API获取节点性能数据
      const response = await fetch(`/get-resource-usage?ip=${nodeIp}&port=${port}`);
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        return {
          CPU_PERCENT: result.data.cpu,
          MEMORY_PERCENT: result.data.memory
        };
      }
      return null;
    } catch (error) {
      console.error(`获取节点 ${nodeIp} 性能数据失败:`, error);
      return null;
    }
  }, []);
  
  // 获取所有节点的性能数据
  const fetchAllNodesPerformance = useCallback(async () => {
    if (!nodes || nodes.length === 0) return;
    
    const updatedNodes = [...nodes];
    
    // 并行获取所有节点的性能数据
    await Promise.all(updatedNodes.map(async (node) => {
      const nodeIp = node['INTERNAL-IP'];
      if (nodeIp) {
        const performanceData = await fetchNodePerformance(nodeIp);
        if (performanceData) {
          node.CPU_PERCENT = performanceData.CPU_PERCENT;
          node.MEMORY_PERCENT = performanceData.MEMORY_PERCENT;
        }
      }
    }));
    
    setNodesWithPerformance(updatedNodes);
  }, [nodes, fetchNodePerformance]);
  
  // 初始加载和节点列表更新时获取性能数据
  useEffect(() => {
    fetchAllNodesPerformance();
  }, [nodes, fetchAllNodesPerformance]);
  
  // 监听节点端口更新事件
  useEffect(() => {
    // 当节点端口更新时，重新获取性能数据
    const handleNodePortUpdated = () => {
      fetchAllNodesPerformance();
    };
    
    // 添加事件监听器
    window.addEventListener('nodePortUpdated', handleNodePortUpdated);
    
    // 清理函数
    return () => {
      window.removeEventListener('nodePortUpdated', handleNodePortUpdated);
    };
  }, [fetchAllNodesPerformance]);
  
  // 自动刷新功能
  useEffect(() => {
    let intervalId;
    
    if (autoRefresh) {
      // 设置定时器，定期刷新节点性能数据
      intervalId = setInterval(() => {
        fetchAllNodesPerformance();
      }, refreshInterval * 1000);
    }
    
    // 清理函数
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, fetchAllNodesPerformance]);
  
  // 刷新节点数据
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAllNodesPerformance();
    setRefreshing(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">节点管理</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoRefresh"
              className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-700">
              自动刷新
            </label>
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="ml-2 text-sm rounded-md border-gray-300 py-1 pl-2 pr-8 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="10">10秒</option>
                <option value="30">30秒</option>
                <option value="60">1分钟</option>
                <option value="300">5分钟</option>
              </select>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            刷新节点
          </Button>
        </div>
      </div>

      {/* 顶部节点资源图表 */}
      <TopNodesResourceChart nodes={nodesWithPerformance} />

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold text-gray-900">集群节点</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">节点名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU使用率</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内存使用率</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内部IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {nodesWithPerformance.map((node) => (
                  <tr key={node.NAME} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{node.NAME}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={node.STATUS === 'Ready' ? "success" : "warning"}>
                        {node.STATUS}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 mr-2 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              (node.CPU_PERCENT || 0) > 80 ? 'bg-red-500' : 
                              (node.CPU_PERCENT || 0) > 60 ? 'bg-yellow-500' : 
                              'bg-blue-500'
                            }`} 
                            style={{ width: `${Math.min(100, Math.max(0, node.CPU_PERCENT || 0))}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">{(node.CPU_PERCENT || 0).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-24 mr-2 bg-gray-200 rounded-full h-2.5">
                          <div 
                            className={`h-2.5 rounded-full ${
                              (node.MEMORY_PERCENT || 0) > 80 ? 'bg-red-500' : 
                              (node.MEMORY_PERCENT || 0) > 60 ? 'bg-yellow-500' : 
                              'bg-purple-500'
                            }`} 
                            style={{ width: `${Math.min(100, Math.max(0, node.MEMORY_PERCENT || 0))}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-700">{(node.MEMORY_PERCENT || 0).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{node['INTERNAL-IP']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button size="sm" onClick={() => onNodeSelect(node)}>
                        详情管理
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Pod管理组件
const PodsView = ({ pods }) => {
  const [loading, setLoading] = useState(false);
  const [podList, setPodList] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [selectedPod, setSelectedPod] = useState(null);
  
  // 获取Pod列表
  const fetchPods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/pods');
      const data = await response.json();
      console.log('获取到的Pod数据:', data);
      setPodList(data.pods || []);
    } catch (error) {
      console.error('获取Pod列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 查看Pod日志
  const handleViewLogs = (pod) => {
    setSelectedPod(pod);
    setShowLogs(true);
  };
  
  // 删除单个Pod
  const handleDeletePod = async (pod) => {
    if (!window.confirm(`确定要删除Pod "${pod.NAME}" 吗？`)) {
      return;
    }
    
    // 由于后端没有删除单个Pod的API接口，我们只显示提示信息
    alert(`删除单个Pod功能需要后端API支持。目前仅展示UI界面，不执行实际操作。\n\n如需实现此功能，请在后端添加删除单个Pod的API接口。`);
  };
  
  // 停止所有Pod
  const handleStopAllPods = async () => {
    if (!window.confirm('确定要停止所有Pod吗？这将删除所有Pod资源。')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/stop-all-pods', {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      alert('所有Pod已停止');
      fetchPods(); // 刷新Pod列表
    } catch (error) {
      console.error('停止所有Pod失败:', error);
      alert('停止所有Pod失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchPods();
  }, []);

  // 如果有传入的pods数据，使用传入的数据
  useEffect(() => {
    if (pods && pods.length > 0) {
      setPodList(pods);
    }
  }, [pods]);
  
  const namespaces = [...new Set(podList.map(pod => pod.NAMESPACE || ''))];
  const filteredPods = selectedNamespace 
    ? podList.filter(pod => pod.NAMESPACE === selectedNamespace) 
    : podList;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'running': return 'success';
      case 'pending': return 'warning'; 
      case 'failed': return 'danger';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Pod 管理</h1>
        <div className="flex space-x-2">
          <Button variant="danger" size="sm" onClick={handleStopAllPods}>
            <Square className="w-4 h-4" />
            停止所有Pod
          </Button>
          <Button variant="outline" size="sm" onClick={fetchPods}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Pod 列表</h2>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">命名空间:</label>
              <Select 
                value={selectedNamespace} 
                onChange={(e) => setSelectedNamespace(e.target.value)}
                className="w-48"
              >
                <option value="">所有命名空间</option>
                {namespaces.map(ns => (
                  <option key={ns} value={ns}>{ns}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">命名空间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pod名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">就绪状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">运行状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">重启次数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPods.length > 0 ? (
                    filteredPods.map((pod, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="info">{pod.NAMESPACE}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{pod.NAME}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pod.READY}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={getStatusColor(pod.STATUS)}>
                            {pod.STATUS}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pod.RESTARTS}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewLogs(pod)}
                            >
                              <FileText className="w-4 h-4" />
                              日志
                            </Button>
                            <Button 
                              size="sm" 
                              variant="danger"
                              onClick={() => handleDeletePod(pod)}
                            >
                              <Trash2 className="w-4 h-4" />
                              删除
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="text-gray-500">
                          <div className="flex justify-center mb-2">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                          </div>
                          <p className="text-lg font-medium">没有找到 Pod</p>
                          <p className="text-sm">当前集群中没有运行中的 Pod，或者后端 API 连接出现问题</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pod日志弹窗 */}
      {showLogs && selectedPod && (
        <PodLogs
          isOpen={showLogs}
          onClose={() => setShowLogs(false)}
          podName={selectedPod.NAME}
          namespace={selectedPod.NAMESPACE}
        />
      )}
    </div>
  );
};

// 节点详情弹窗组件
const NodeDetailModal = ({ node, onClose }) => {
  const [ip, setIp] = useState(node?.['INTERNAL-IP'] || '');
  // 尝试从本地存储中获取端口号
  const [port, setPort] = useState(() => {
    const savedPort = localStorage.getItem(`nodePort_${node?.['INTERNAL-IP']}`);
    return savedPort || '30081';
  });
  const [path, setPath] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [files, setFiles] = useState([]);
  // 节点详情-文件浏览 分页状态
  const [filesPage, setFilesPage] = useState(1);
  const [filesPerPage, setFilesPerPage] = useState(100);
  const [showResourceMonitor, setShowResourceMonitor] = useState(false);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [showFolderDownloader, setShowFolderDownloader] = useState(false);
  const [selectedFolderPath, setSelectedFolderPath] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUploadAlgo = async () => {
    if (!uploadFile) {
      alert('请选择文件');
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('ip', ip);
    formData.append('port', port);

    try {
      const response = await fetch('/upload-algo', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      alert(data.status === 'success' ? '上传成功!' : '上传失败: ' + data.error);
    } catch (error) {
      alert('上传失败: ' + error.message);
    }
  };

  // 保存IP到端口的映射
  const handleSaveIpPortMapping = () => {
    if (!ip || !port) {
      alert('IP地址和端口不能为空');
      return;
    }
    
    try {
      // 保存到localStorage
      localStorage.setItem(`nodePort_${ip}`, port);
      
      // 显示保存成功提示
      setSaveSuccess(true);
      
      // 3秒后隐藏提示
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      // 触发一个自定义事件，通知其他组件端口号已更新
      const event = new CustomEvent('nodePortUpdated', { 
        detail: { nodeIp: ip, port } 
      });
      window.dispatchEvent(event);
    } catch (error) {
      alert('保存失败: ' + error.message);
    }
  };

  const handleListFiles = async () => {
    try {
      const response = await fetch(`/list-files?ip=${ip}&port=${port}&path=${path}`);
      const data = await response.json();
      if (data.status === 'success' && data.data?.files) {
        setFiles(data.data.files);
        setFilesPage(1);
      } else {
        alert('获取文件列表失败');
      }
    } catch (error) {
      alert('获取文件列表失败: ' + error.message);
    }
  };

  // 清空工作区
  const handleClearWorkspace = async () => {
    if (!ip || !port) {
      alert('请先填写IP与端口');
      return;
    }
    if (!window.confirm('确认清空该节点的工作区？此操作不可恢复！')) {
      return;
    }
    try {
      const res = await fetch('/clear-workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, port: Number(port) })
      });
      const result = await res.json();
      if (result.status === 'success') {
        alert('工作区已清空');
        // 清空后刷新列表（根目录）
        setPath('');
        setFiles([]);
        // 可选：尝试重新拉取当前路径
        // await handleListFiles();
      } else {
        alert(`清空失败: ${result.http_status || ''} ${result.error || ''}`);
      }
    } catch (e) {
      alert('清空失败: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">节点详情: {node?.NAME}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>
            ✕ 关闭
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* 节点基本信息 */}
        <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">基本信息</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(node || {}).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">{key}</div>
                    <div className="text-sm text-gray-900 font-mono">{value}</div>
                </div>
              ))}
            </div>
            </CardContent>
          </Card>

          {/* 远程连接配置 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">远程连接配置</h3>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IP地址</label>
                  <Input value={ip} onChange={(e) => setIp(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">端口</label>
                  <Input value={port} onChange={(e) => setPort(e.target.value)} />
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                {/* 保存成功提示 */}
                {saveSuccess && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    <span className="text-sm">保存成功</span>
                  </div>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSaveIpPortMapping}
                    className="flex items-center"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    保存配置
                  </Button>
              <Button
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setShowResourceMonitor(true)}
                    className="flex items-center"
                  >
                    <Activity className="w-4 h-4 mr-1" />
                    查看节点资源使用情况
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 文件上传 */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">算法文件上传</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input 
                type="file" 
                onChange={(e) => setUploadFile(e.target.files[0])}
              />
              <Button onClick={handleUploadAlgo}>
                <Upload className="w-4 h-4" />
                上传算法文件
              </Button>
            </CardContent>
          </Card>

            {/* 文件浏览 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <h3 className="text-lg font-semibold">文件浏览</h3>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowFileBrowser(true)}
                >
                  <Folder className="w-4 h-4 mr-1" />
                  高级文件浏览器
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedFolderPath(path);
                    setShowFolderDownloader(true);
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  下载文件夹
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={handleClearWorkspace}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  清空工作区
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
              <Input
                value={path}
                onChange={(e) => setPath(e.target.value)}
                  placeholder="输入路径 (如: workspace/)"
                  className="flex-1"
                />
                <Button onClick={handleListFiles}>
                  <Folder className="w-4 h-4" />
                  浏览
                </Button>
              </div>
              
              {files.length > 0 && (
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h4 className="font-medium mb-2">文件列表:</h4>
                  {/* 顶部分页控制 */}
                  {files.length > filesPerPage && (
                    <div className="flex items-center justify-between mb-2 text-xs text-gray-600">
                      <div>
                        显示 {Math.min(files.length, (filesPage - 1) * filesPerPage + 1)} - {Math.min(files.length, filesPage * filesPerPage)} / {files.length}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => setFilesPage(1)} disabled={filesPage===1} className={`px-2 py-1 rounded ${filesPage===1? 'bg-gray-100 text-gray-400':'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>首页</button>
                        <button onClick={() => setFilesPage(p=>Math.max(1,p-1))} disabled={filesPage===1} className={`px-2 py-1 rounded ${filesPage===1? 'bg-gray-100 text-gray-400':'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>上一页</button>
                        <span className="px-2">第 {filesPage} 页 / {Math.max(1, Math.ceil(files.length / filesPerPage))}</span>
                        <button onClick={() => setFilesPage(p=>Math.min(Math.ceil(files.length/filesPerPage),p+1))} disabled={filesPage===Math.ceil(files.length/filesPerPage)} className={`px-2 py-1 rounded ${filesPage===Math.ceil(files.length/filesPerPage)? 'bg-gray-100 text-gray-400':'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>下一页</button>
                        <button onClick={() => setFilesPage(Math.ceil(files.length/filesPerPage))} disabled={filesPage===Math.ceil(files.length/filesPerPage)} className={`px-2 py-1 rounded ${filesPage===Math.ceil(files.length/filesPerPage)? 'bg-gray-100 text-gray-400':'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>末页</button>
                        <select value={filesPerPage} onChange={(e)=>{setFilesPerPage(Number(e.target.value)); setFilesPage(1);}} className="ml-2 border rounded px-1 py-0.5">
                          <option value={50}>50/页</option>
                          <option value={100}>100/页</option>
                          <option value={200}>200/页</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <ul className="space-y-1">
                    {files.slice((filesPage-1)*filesPerPage, (filesPage-1)*filesPerPage + filesPerPage).map((file, index) => {
                      const isDirectory = !file.includes('.');
                      return (
                        <li 
                          key={index} 
                          className="text-sm text-gray-600 font-mono p-2 hover:bg-gray-50 rounded flex justify-between items-center"
                        >
                          <div className="flex items-center">
                            {isDirectory ? (
                              <Folder className="w-4 h-4 text-yellow-500 mr-2" />
                            ) : (
                              <File className="w-4 h-4 text-blue-500 mr-2" />
                            )}
                            {file}
                          </div>
                          <div className="flex space-x-1">
                            {isDirectory ? (
                              <button
                                onClick={() => {
                                  const newPath = path ? `${path}/${file}` : file;
                                  setPath(newPath);
                                  handleListFiles();
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1 rounded"
                                title="进入文件夹"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  const filePath = path ? `${path}/${file}` : file;
                                  try {
                                    // 发起GET请求获取文件
                                    const response = await fetch(`/list-files?ip=${encodeURIComponent(ip)}&port=${encodeURIComponent(port)}&path=${encodeURIComponent(filePath)}`);
                                    
                                    // 检查响应状态
                                    if (!response.ok) {
                                      throw new Error(`HTTP error! status: ${response.status}`);
                                    }
                                    
                                    // 获取文件内容
                                    const blob = await response.blob();
                                    
                                    // 创建下载链接
                                    const downloadUrl = window.URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = downloadUrl;
                                    a.download = file;
                                    document.body.appendChild(a);
                                    a.click();
                                    
                                    // 清理
                                    window.URL.revokeObjectURL(downloadUrl);
                                    document.body.removeChild(a);
                                  } catch (error) {
                                    console.error('下载文件失败:', error);
                                    alert(`下载文件失败: ${error.message}`);
                                  }
                                }}
                                className="text-green-600 hover:text-green-800 p-1 rounded"
                                title="下载文件"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </li>
                      );
                    })}
              </ul>
            </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 节点资源监控弹窗 */}
      {showResourceMonitor && (
        <NodeResourceMonitor
          isOpen={showResourceMonitor}
          onClose={() => setShowResourceMonitor(false)}
          nodeIp={ip}
        />
      )}

      {/* 文件浏览器 */}
      <FileBrowser 
        isOpen={showFileBrowser}
        onClose={() => setShowFileBrowser(false)}
        nodeIp={ip}
        nodePort={port}
      />

      {/* 文件夹下载器 */}
      <FolderDownloader 
        isOpen={showFolderDownloader}
        onClose={() => setShowFolderDownloader(false)}
        folderPath={selectedFolderPath}
        nodeIp={ip}
        nodePort={port}
      />
    </div>
  );
};

// 主应用组件
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clusters, setClusters] = useState([]);
  const [activeCluster, setActiveCluster] = useState('');
  const [nodes, setNodes] = useState([]);
  const [pods, setPods] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [showJobCreator, setShowJobCreator] = useState(false);
  const [showResourceMonitor, setShowResourceMonitor] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  // 侧边栏菜单项
  const menuItems = [
    { id: 'dashboard', label: '仪表板', icon: Home },
    { id: 'clusters', label: '集群管理', icon: Server },
    { id: 'nodes', label: '节点管理', icon: Cpu },
    { id: 'pods', label: 'Pod管理', icon: Container },
    { id: 'deployments', label: '部署管理', icon: FileText },
    { id: 'services', label: '服务管理', icon: Network },
    { id: 'docker', label: 'Docker镜像', icon: Database },
    { id: 'files', label: '文件浏览器', icon: Folder }
  ];

  // 获取数据的函数
  const fetchClusters = async () => {
    try {
      const response = await fetch('/k8s-clusters');
      const data = await response.json();
      setClusters(data.clusters || []);
      setActiveCluster(data.active || '');
    } catch (error) {
      console.error('获取集群列表失败:', error);
    }
  };

  const fetchNodes = useCallback(async () => {
    if (!activeCluster) return;
    try {
      const response = await fetch(`/cluster-nodes?cluster=${activeCluster}`);
      const data = await response.json();
      setNodes(data.nodes || []);
    } catch (error) {
      console.error('获取节点列表失败:', error);
    }
  }, [activeCluster]);

  const fetchPods = useCallback(async () => {
    try {
      console.log('正在获取Pod列表...');
      const response = await fetch('/pods');
      const data = await response.json();
      console.log('获取到的Pod数据:', data);
      setPods(data.pods || []);
    } catch (error) {
      console.error('获取Pod列表失败:', error);
    }
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/services');
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('获取服务列表失败:', error);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchClusters();
    fetchPods();
    fetchServices();
  }, [fetchPods]);

  // 当活动集群改变时获取节点
  useEffect(() => {
    fetchNodes();
  }, [activeCluster, fetchNodes]);

  // 渲染主要内容
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          clusters={clusters} 
          nodes={nodes} 
          pods={pods} 
          services={services} 
          onCreateJob={() => setShowJobCreator(true)} 
          onOpenMonitor={() => setShowResourceMonitor(true)}
          onOpenTerminal={() => setShowTerminal(true)}
        />;
      case 'clusters':
        return <ClustersView clusters={clusters} activeCluster={activeCluster} onClusterChange={setActiveCluster} />;
      case 'nodes':
        return <NodesView nodes={nodes} onNodeSelect={setSelectedNode} />;
      case 'pods':
        return <PodsView pods={pods} />;
      case 'services':
        return <ServicesView />;
      case 'docker':
        return <DockerImagesView />;
      case 'deployments':
        return <DeploymentsView />;
      case 'files':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-gray-900">文件浏览器</h1>
            </div>
            <Card>
              <CardHeader>
                <h2 className="text-xl font-semibold text-gray-900">文件操作</h2>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        文件浏览功能需要选择一个具体的节点才能使用。请在<strong>节点管理</strong>页面选择一个节点，然后在节点详情中使用文件浏览功能。
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-6 bg-gray-50">
                    <h3 className="text-lg font-medium mb-2">节点文件浏览</h3>
                    <p className="text-gray-600 mb-4">
                      您可以在节点详情页面中浏览和下载节点上的文件。
                    </p>
                    <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                      <li>前往<strong>节点管理</strong>页面</li>
                      <li>点击任意节点的<strong>详情管理</strong>按钮</li>
                      <li>在节点详情页中使用<strong>文件浏览</strong>功能</li>
                    </ol>
                  </div>
                  <div className="border rounded-lg p-6 bg-gray-50">
                    <h3 className="text-lg font-medium mb-2">文件下载功能</h3>
                    <p className="text-gray-600 mb-4">
                      在节点详情页中，您可以：
                    </p>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                      <li>下载单个文件</li>
                      <li>使用高级文件浏览器进行文件搜索和批量下载</li>
                      <li>下载整个文件夹的内容</li>
                    </ul>
                  </div>
                </div>
          </CardContent>
        </Card>
          </div>
        );
      default:
        return <Dashboard 
          clusters={clusters} 
          nodes={nodes} 
          pods={pods} 
          services={services} 
          onCreateJob={() => setShowJobCreator(true)} 
          onOpenMonitor={() => setShowResourceMonitor(true)}
          onOpenTerminal={() => setShowTerminal(true)}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 侧边栏 */}
      <div className="w-64 bg-white shadow-lg border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <Server className="w-6 h-6 mr-2 text-blue-600" />
            Volcano K8s
          </h1>
          <p className="text-sm text-gray-500 mt-1">集群管理平台</p>
        </div>
        
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-50 transition-colors duration-200 ${
                activeTab === item.id 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                  : 'text-gray-700'
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 ${
                activeTab === item.id ? 'text-blue-600' : 'text-gray-400'
              }`} />
              {item.label}
            </button>
          ))}
        </nav>

        {/* 集群状态 */}
        <div className="absolute bottom-0 left-0 w-64 p-6 border-t border-gray-200 bg-white">
          <div className="text-sm text-gray-500">
            <div className="flex items-center justify-between">
              <span>当前集群:</span>
              <Badge variant="success" className="ml-2">
                {activeCluster || '未选择'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </div>

      {/* 节点详情弹窗 */}
      {selectedNode && (
        <NodeDetailModal 
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

      {/* 任务创建弹窗 */}
      <JobCreator 
        isOpen={showJobCreator}
        onClose={() => setShowJobCreator(false)}
      />

      {/* 资源监控弹窗 */}
      <ResourceMonitor 
        isOpen={showResourceMonitor}
        onClose={() => setShowResourceMonitor(false)}
        nodes={nodes}
      />

      {/* 终端执行器 */}
      <TerminalExecutor 
        isOpen={showTerminal}
        onClose={() => setShowTerminal(false)}
      />
    </div>
  );
}