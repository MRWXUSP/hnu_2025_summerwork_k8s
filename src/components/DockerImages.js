import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Upload, 
  RefreshCw, 
  Download,
  Trash2,
  Search,
  Filter
} from 'lucide-react';

const DockerImagesView = () => {
  const [images, setImages] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedCluster, setSelectedCluster] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 获取Docker镜像列表
  const fetchDockerImages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/docker-images');
      const data = await response.json();
      setImages(data.images || []);
    } catch (error) {
      console.error('获取Docker镜像失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取集群列表
  const fetchClusters = async () => {
    try {
      const response = await fetch('/k8s-clusters');
      const data = await response.json();
      setClusters(data.clusters || []);
    } catch (error) {
      console.error('获取集群列表失败:', error);
    }
  };

  // 加载镜像到集群
  const handleLoadImage = async () => {
    if (!selectedImage || !selectedCluster) {
      alert('请选择镜像和集群');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/load-image-to-cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: selectedImage, cluster: selectedCluster })
      });
      const data = await response.json();
      alert(data.success ? '镜像加载成功!' : '镜像加载失败: ' + data.error);
    } catch (error) {
      alert('镜像加载失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 过滤镜像
  const filteredImages = images.filter(image =>
    image['REPOSITORY:TAG'].toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchDockerImages();
    fetchClusters();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Docker 镜像管理</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchDockerImages}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新镜像
          </button>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索镜像名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Filter className="w-4 h-4" />
            <span>共 {filteredImages.length} 个镜像</span>
          </div>
        </div>
      </div>

      {/* 镜像加载到集群 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">加载镜像到集群</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择镜像</label>
              <select 
                value={selectedImage} 
                onChange={(e) => setSelectedImage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">选择镜像...</option>
                {filteredImages.map((image, index) => (
                  <option key={index} value={image['REPOSITORY:TAG']}>
                    {image['REPOSITORY:TAG']}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">选择集群</label>
              <select 
                value={selectedCluster} 
                onChange={(e) => setSelectedCluster(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">选择集群...</option>
                {clusters.map((cluster) => (
                  <option key={cluster} value={cluster}>
                    {cluster}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button 
            onClick={handleLoadImage} 
            disabled={loading || !selectedImage || !selectedCluster}
            className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                加载中...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                加载到集群
              </>
            )}
          </button>
        </div>
      </div>

      {/* 镜像列表 */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">本地 Docker 镜像</h2>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">镜像名称:标签</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">镜像ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">大小</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredImages.map((image, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {image['REPOSITORY:TAG']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {image['IMAGE ID'].substring(0, 12)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {image['CREATED AT']}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {image.SIZE}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button 
                          onClick={() => setSelectedImage(image['REPOSITORY:TAG'])}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                        >
                          选择
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DockerImagesView;