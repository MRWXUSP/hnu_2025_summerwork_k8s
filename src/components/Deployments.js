import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, 
  PlusCircle, 
  Trash2, 
  Edit, 
  AlertCircle,
  X,
  Save,
  Play,
  Pause,
  Info
} from 'lucide-react';

// 部署列表组件
const DeploymentsView = () => {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 获取部署列表
  const fetchDeployments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/deployments');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDeployments(data.deployments || []);
    } catch (error) {
      console.error('获取部署列表失败:', error);
      setError('获取部署列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchDeployments();
  }, [fetchDeployments]);

  // 删除所有部署
  const handleStopAllDeployments = async () => {
    if (!window.confirm('确定要停止所有部署吗？这将删除所有部署资源。')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/stop-all-deployments', {
        method: 'POST'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      alert('所有部署已停止');
      fetchDeployments();
    } catch (error) {
      console.error('停止所有部署失败:', error);
      setError('停止所有部署失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 查看部署详情
  const handleViewDeployment = (deployment) => {
    setSelectedDeployment(deployment);
    setShowDetailModal(true);
  };

  // 编辑部署
  const handleEditDeployment = (deployment) => {
    setSelectedDeployment(deployment);
    setShowEditModal(true);
  };

  // 删除单个部署
  const handleDeleteDeployment = async (deployment) => {
    if (!window.confirm(`确定要删除部署 "${deployment.NAME}" 吗？`)) {
      return;
    }

    // 显示提示信息，因为我们不修改后端API
    alert('删除单个部署功能需要后端API支持。目前仅展示UI界面，不执行实际操作。');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">部署管理</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusCircle className="w-4 h-4 mr-1" />
            创建部署
          </button>
          <button
            onClick={fetchDeployments}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={handleStopAllDeployments}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            停止所有部署
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden rounded-lg">
        {loading && deployments.length === 0 ? (
          <div className="flex justify-center items-center h-32">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">加载中...</span>
          </div>
        ) : deployments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p>暂无部署</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              创建新部署
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">命名空间</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">就绪</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最新</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">可用</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deployments.map((deployment, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deployment.NAMESPACE}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{deployment.NAME}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deployment.READY}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deployment['UP-TO-DATE']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{deployment.AVAILABLE}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(deployment.AGE).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewDeployment(deployment)}
                          className="text-blue-600 hover:text-blue-900"
                          title="查看详情"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditDeployment(deployment)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="编辑"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDeployment(deployment)}
                          className="text-red-600 hover:text-red-900"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 部署详情模态框 */}
      {showDetailModal && selectedDeployment && (
        <DeploymentDetailModal 
          deployment={selectedDeployment} 
          onClose={() => setShowDetailModal(false)} 
        />
      )}

      {/* 创建部署模态框 */}
      {showCreateModal && (
        <CreateDeploymentModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchDeployments}
        />
      )}

      {/* 编辑部署模态框 */}
      {showEditModal && selectedDeployment && (
        <EditDeploymentModal 
          deployment={selectedDeployment}
          onClose={() => setShowEditModal(false)}
          onSuccess={fetchDeployments}
        />
      )}
    </div>
  );
};

// 部署详情模态框组件
const DeploymentDetailModal = ({ deployment, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">部署详情: {deployment.NAME}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(deployment).map(([key, value]) => (
              <div key={key} className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-500">{key}</div>
                <div className="text-sm text-gray-900 font-mono">{value}</div>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500">
              注意: 目前只显示基本信息。要查看更详细的部署配置，需要添加额外的API接口。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// 创建部署模态框组件
const CreateDeploymentModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    namespace: 'default',
    image: '',
    replicas: 1,
    containerPort: 80,
    labels: '',
    env: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 显示提示信息，因为我们不修改后端API
      alert('创建部署功能需要后端API支持。目前仅展示UI界面，不执行实际操作。');
      onClose();
    } catch (error) {
      console.error('创建部署失败:', error);
      setError('创建部署失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">创建新部署</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">部署名称</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">命名空间</label>
            <input
              type="text"
              name="namespace"
              value={formData.namespace}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">镜像</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              required
              placeholder="例如: nginx:latest"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">副本数</label>
            <input
              type="number"
              name="replicas"
              value={formData.replicas}
              onChange={handleChange}
              required
              min="1"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">容器端口</label>
            <input
              type="number"
              name="containerPort"
              value={formData.containerPort}
              onChange={handleChange}
              required
              min="1"
              max="65535"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">标签 (格式: key1=value1,key2=value2)</label>
            <input
              type="text"
              name="labels"
              value={formData.labels}
              onChange={handleChange}
              placeholder="app=nginx,environment=production"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">环境变量 (格式: KEY1=VALUE1,KEY2=VALUE2)</label>
            <input
              type="text"
              name="env"
              value={formData.env}
              onChange={handleChange}
              placeholder="DEBUG=true,LOG_LEVEL=info"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  创建部署
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 编辑部署模态框组件
const EditDeploymentModal = ({ deployment, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: deployment.NAME,
    namespace: deployment.NAMESPACE,
    replicas: parseInt(deployment.READY.split('/')[1]) || 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 显示提示信息，因为我们不修改后端API
      alert('编辑部署功能需要后端API支持。目前仅展示UI界面，不执行实际操作。');
      onClose();
    } catch (error) {
      console.error('更新部署失败:', error);
      setError('更新部署失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">编辑部署: {deployment.NAME}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">部署名称</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              disabled
              className="mt-1 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">部署名称不可更改</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">命名空间</label>
            <input
              type="text"
              name="namespace"
              value={formData.namespace}
              disabled
              className="mt-1 block w-full border border-gray-300 bg-gray-100 rounded-md shadow-sm py-2 px-3 focus:outline-none sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">命名空间不可更改</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">副本数</label>
            <input
              type="number"
              name="replicas"
              value={formData.replicas}
              onChange={handleChange}
              required
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  更新部署
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeploymentsView;
