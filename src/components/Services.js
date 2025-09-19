import React, { useState, useEffect } from 'react';
import { 
  Network, 
  RefreshCw, 
  Trash2,
  ExternalLink,
  Info,
  AlertCircle
} from 'lucide-react';

const ServicesView = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedNamespace, setSelectedNamespace] = useState('');

  // 获取服务列表
  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/services');
      const data = await response.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('获取服务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 停止所有服务
  const handleStopAllServices = async () => {
    if (!window.confirm('确定要停止所有服务吗？这将删除default命名空间中的所有服务（除了kubernetes服务）。')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/stop-all-services', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.status) {
        alert('服务停止操作已启动: ' + data.status);
        fetchServices(); // 重新获取服务列表
      } else if (data.error) {
        alert('停止服务失败: ' + data.error);
      }
    } catch (error) {
      alert('停止服务失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const namespaces = [...new Set(services.map(service => service.NAMESPACE))];
  const filteredServices = selectedNamespace 
    ? services.filter(service => service.NAMESPACE === selectedNamespace) 
    : services;

  const getServiceTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'clusterip': return 'bg-blue-100 text-blue-800';
      case 'nodeport': return 'bg-green-100 text-green-800';
      case 'loadbalancer': return 'bg-purple-100 text-purple-800';
      case 'externalname': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">服务管理</h1>
        <div className="flex space-x-2">
          <button
            onClick={handleStopAllServices}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            停止所有服务
          </button>
          <button
            onClick={fetchServices}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-blue-100">
              <Network className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{services.length}</p>
              <p className="text-sm text-gray-500">总服务数</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-green-100">
              <ExternalLink className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {services.filter(s => s.TYPE === 'LoadBalancer').length}
              </p>
              <p className="text-sm text-gray-500">负载均衡器</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-purple-100">
              <Network className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">
                {services.filter(s => s.TYPE === 'NodePort').length}
              </p>
              <p className="text-sm text-gray-500">NodePort</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 rounded-lg bg-orange-100">
              <Info className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{namespaces.length}</p>
              <p className="text-sm text-gray-500">命名空间</p>
            </div>
          </div>
        </div>
      </div>

      {/* 服务列表 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">服务列表</h2>
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">命名空间:</label>
              <select 
                value={selectedNamespace} 
                onChange={(e) => setSelectedNamespace(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="">所有命名空间</option>
                {namespaces.map(ns => (
                  <option key={ns} value={ns}>{ns}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="p-6">
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">服务名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">集群IP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">外部IP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">端口</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredServices.map((service, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {service.NAMESPACE}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {service.NAME}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceTypeColor(service.TYPE)}`}>
                          {service.TYPE}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {service['CLUSTER-IP']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service['EXTERNAL-IP'] || (
                          <span className="text-gray-400 italic">无</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {service['PORT(S)']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(service.AGE).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredServices.length === 0 && !loading && (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">没有找到服务</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {selectedNamespace ? `命名空间 "${selectedNamespace}" 中没有服务` : '当前集群中没有服务'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ServicesView;

