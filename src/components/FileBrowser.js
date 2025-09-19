import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, 
  File, 
  ChevronRight, 
  RefreshCw, 
  ArrowLeft, 
  Download, 
  X,
  Search
} from 'lucide-react';
import { ensureValidPort, parsePort } from '../utils/portUtils';

const FileBrowser = ({ isOpen, onClose, nodeIp, nodePort = '30081' }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  // 确保初始端口号有效
  const [customPort, setCustomPort] = useState(() => ensureValidPort(nodePort, '30081'));
  
  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(100); // 每页显示100个文件
  const [totalPages, setTotalPages] = useState(1);

  // 获取文件列表
  const fetchFiles = useCallback(async (path = '') => {
    if (!nodeIp) {
      setError("请选择一个节点");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // 确保端口号有效
      const validPort = ensureValidPort(customPort);
      const portNum = parsePort(validPort);
      if (!portNum) {
        throw new Error(`端口号无效: ${customPort}`);
      }
      
      // 使用修复后的端口号
      console.log(`获取文件列表使用端口: ${portNum}, 路径: ${path}`);
      const url = `/list-files?ip=${encodeURIComponent(nodeIp)}&port=${portNum}&path=${encodeURIComponent(path)}`;
      
      const response = await fetch(url);
      
      // 检查是否是文件下载响应
      const contentType = response.headers.get('content-type');
      if (contentType && (contentType.startsWith('application/octet-stream') || contentType.startsWith('text/'))) {
        try {
          // 这是一个文件，提示用户下载
          const fileName = path.split('/').pop();
          
          // 创建blob链接并下载
          const blob = await response.blob();
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
          
          // 下载完成后刷新当前目录列表，避免依赖 goBack 造成hook依赖警告
          await fetchFiles(currentPath);
          return;
        } catch (error) {
          console.error('下载文件失败:', error);
          setError(`下载文件失败: ${error.message}`);
          return;
        }
      }
      
      const data = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        // 处理文件列表
        let fileList = [];
        if (data.files) {
          fileList = data.files;
        } else if (data.data && data.data.files) {
          fileList = data.data.files;
        }
        
        // 分类文件和文件夹
        const sortedFiles = fileList.sort((a, b) => {
          // 尝试判断是否为文件夹（没有扩展名的可能是文件夹）
          const aIsDir = !a.includes('.');
          const bIsDir = !b.includes('.');
          
          if (aIsDir && !bIsDir) return -1;
          if (!aIsDir && bIsDir) return 1;
          return a.localeCompare(b);
        });
        
        // 更新总页数
        setTotalPages(Math.ceil(sortedFiles.length / itemsPerPage));
        
        // 重置为第一页
        setCurrentPage(1);
        
        // 保存完整文件列表
        setFiles(sortedFiles);
        
        // 更新路径历史和当前路径
        // 注意：这里是导致无法进入文件夹的关键修复点
        console.log(`更新路径: 当前=${currentPath}, 新=${path}`);
        if (path !== currentPath) {
          setPathHistory(prev => [...prev, currentPath]);
          setCurrentPath(path);
        }
      }
    } catch (error) {
      setError(`获取文件列表失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [nodeIp, customPort, currentPath, itemsPerPage]);

  // 当端口变化时更新customPort
  useEffect(() => {
    // 确保端口号有效
    setCustomPort(ensureValidPort(nodePort, '30081'));
  }, [nodePort]);

  // 初始加载
  useEffect(() => {
    if (isOpen && nodeIp) {
      fetchFiles('');
    }
  }, [isOpen, nodeIp, fetchFiles]);

  // 返回上一级目录
  const goBack = useCallback(() => {
    if (pathHistory.length > 0) {
      const prevPath = pathHistory[pathHistory.length - 1];
      setPathHistory(prev => prev.slice(0, -1));
      setCurrentPath(prevPath);
      fetchFiles(prevPath);
    }
  }, [pathHistory, fetchFiles]);

  // 进入文件夹
  const navigateTo = useCallback((folder) => {
    const newPath = currentPath ? `${currentPath}/${folder}` : folder;
    console.log(`导航到文件夹: ${newPath}`);
    fetchFiles(newPath);
  }, [currentPath, fetchFiles]);

  // 下载文件已在各处内联实现

  // 获取当前页的文件
  const getCurrentPageItems = useCallback(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, files.length);
    return files.slice(startIndex, endIndex);
  }, [files, currentPage, itemsPerPage]);

  // 切换到指定页
  const goToPage = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  // 搜索文件
  const searchFiles = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    setError(null);
    
    try {
      // 这里应该实现文件搜索功能
      // 由于API中没有直接的搜索接口，这里可以模拟一个简单的搜索
      // 实际应用中，可能需要后端提供专门的搜索API
      
      // 模拟搜索结果
      const results = files.filter(file => 
        file.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(file => ({
        name: file,
        path: currentPath ? `${currentPath}/${file}` : file,
        isDirectory: !file.includes('.')
      }));
      
      setSearchResults(results);
    } catch (error) {
      setError(`搜索失败: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // 处理搜索输入变化
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    if (!e.target.value) {
      setSearchResults([]);
    }
  };

  // 处理搜索提交
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchFiles();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-4xl h-[80vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
          <div className="flex items-center">
            <Folder className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">文件浏览器</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 节点信息 */}
        <div className="bg-blue-50 p-3 border-b border-blue-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-700 mr-2">节点:</span>
              <span className="text-sm font-mono bg-blue-100 px-2 py-1 rounded">{nodeIp || '未选择'}</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-700 mr-2">端口:</span>
              <input
                type="text"
                value={customPort}
                onChange={(e) => setCustomPort(e.target.value)}
                className="text-sm font-mono bg-white border border-blue-300 px-2 py-1 rounded w-20"
              />
              <button
                onClick={() => fetchFiles(currentPath)}
                className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
              >
                应用
              </button>
            </div>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="bg-gray-100 p-3 border-b border-gray-300">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={goBack}
                disabled={pathHistory.length === 0}
                className={`p-2 rounded-md ${
                  pathHistory.length === 0 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
                title="返回上一级"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => fetchFiles(currentPath)}
                disabled={loading}
                className="p-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md"
                title="刷新"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <div className="text-sm text-gray-600 ml-2">
                当前路径: <span className="font-mono">{currentPath || '/'}</span>
              </div>
            </div>
            
            {/* 搜索框 */}
            <form onSubmit={handleSearchSubmit} className="flex">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="搜索文件..."
                  className="pl-8 pr-4 py-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                />
                <Search className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4" />
              </div>
              <button
                type="submit"
                disabled={!searchQuery.trim() || isSearching}
                className={`px-3 py-2 rounded-r-md ${
                  !searchQuery.trim() || isSearching
                    ? 'bg-gray-300 text-gray-500'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSearching ? '搜索中...' : '搜索'}
              </button>
            </form>
          </div>
        </div>
        
        {/* 文件列表区域 */}
        <div className="flex-1 overflow-auto p-2">
          {error ? (
            <div className="p-4 m-4 bg-red-100 text-red-800 border-l-4 border-red-500 rounded">
              <p className="font-medium">错误</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-500">加载中...</span>
            </div>
          ) : searchResults.length > 0 ? (
            // 搜索结果
            <div>
              <h3 className="text-lg font-medium mb-2">搜索结果 ({searchResults.length})</h3>
              <div className="bg-gray-50 p-2 rounded-lg">
                {searchResults.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    {item.isDirectory ? (
                      <>
                        <Folder className="w-5 h-5 text-yellow-500 mr-2" />
                        <span 
                          className="flex-1"
                          onClick={() => {
                            setSearchResults([]);
                            setSearchQuery('');
                            fetchFiles(item.path);
                          }}
                        >
                          {item.name}
                        </span>
                        <button
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="进入文件夹"
                          onClick={() => {
                            setSearchResults([]);
                            setSearchQuery('');
                            fetchFiles(item.path);
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <File className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="flex-1">{item.name}</span>
                        <button
                          className="p-1 text-green-600 hover:text-green-800"
                          title="下载文件"
                          onClick={async () => {
                            try {
                              // 确保端口号有效
                              const validPort = ensureValidPort(customPort);
                              const portNum = parsePort(validPort);
                              if (!portNum) {
                                throw new Error(`端口号无效: ${customPort}`);
                              }
                              
                              // 使用修复后的端口号
                              console.log(`下载搜索结果文件使用端口: ${portNum}`);
                              const response = await fetch(`/list-files?ip=${encodeURIComponent(nodeIp)}&port=${portNum}&path=${encodeURIComponent(item.path)}`);
                              
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
                              a.download = item.name;
                              document.body.appendChild(a);
                              a.click();
                              
                              // 清理
                              window.URL.revokeObjectURL(downloadUrl);
                              document.body.removeChild(a);
                            } catch (error) {
                              console.error('下载文件失败:', error);
                              setError(`下载文件失败: ${error.message}`);
                            }
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 常规文件列表
            <div className="grid grid-cols-1 gap-1">
              {files.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  此文件夹为空
                </div>
              ) : (
                <>
                  {/* 分页信息 */}
                  {files.length > itemsPerPage && (
                    <div className="flex items-center justify-between p-2 bg-gray-50 border-b border-gray-200">
                      <div className="text-sm text-gray-500">
                        显示 {Math.min(files.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(files.length, currentPage * itemsPerPage)} 项，共 {files.length} 项
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => goToPage(1)}
                          disabled={currentPage === 1}
                          className={`px-2 py-1 text-xs rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          首页
                        </button>
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`px-2 py-1 text-xs rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          上一页
                        </button>
                        <span className="px-2 py-1 text-xs">
                          第 {currentPage} 页，共 {totalPages} 页
                        </span>
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`px-2 py-1 text-xs rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          下一页
                        </button>
                        <button
                          onClick={() => goToPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className={`px-2 py-1 text-xs rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          末页
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* 文件列表 */}
                  {getCurrentPageItems().map((file, index) => {
                  const isDirectory = !file.includes('.');
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer ${
                        selectedFile === file ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedFile(file)}
                    >
                      {isDirectory ? (
                        <>
                          <Folder className="w-5 h-5 text-yellow-500 mr-2" />
                          <span 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo(file);
                            }}
                          >
                            {file}/
                          </span>
                          <button
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="进入文件夹"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo(file);
                            }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <File className="w-5 h-5 text-blue-500 mr-2" />
                          <span className="flex-1">{file}</span>
                          <button
                            className="p-1 text-green-600 hover:text-green-800"
                            title="下载文件"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const filePath = currentPath ? `${currentPath}/${file}` : file;
                              try {
                                // 确保端口号有效
                                const validPort = ensureValidPort(customPort);
                                const portNum = parsePort(validPort);
                                if (!portNum) {
                                  throw new Error(`端口号无效: ${customPort}`);
                                }
                                
                                // 使用修复后的端口号
                                console.log(`下载文件使用端口: ${portNum}`);
                                const response = await fetch(`/list-files?ip=${encodeURIComponent(nodeIp)}&port=${portNum}&path=${encodeURIComponent(filePath)}`);
                                
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
                                setError(`下载文件失败: ${error.message}`);
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
                
                {/* 底部分页 */}
                {files.length > itemsPerPage && (
                  <div className="flex items-center justify-between p-2 mt-2 bg-gray-50 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      显示 {Math.min(files.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(files.length, currentPage * itemsPerPage)} 项，共 {files.length} 项
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className={`px-2 py-1 text-xs rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        首页
                      </button>
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`px-2 py-1 text-xs rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        上一页
                      </button>
                      <span className="px-2 py-1 text-xs">
                        第 {currentPage} 页，共 {totalPages} 页
                      </span>
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`px-2 py-1 text-xs rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        下一页
                      </button>
                      <button
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`px-2 py-1 text-xs rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        末页
                      </button>
                    </div>
                  </div>
                )}
                </>
              )}
            </div>
          )}
        </div>
        
        {/* 状态栏 */}
        <div className="bg-gray-100 p-2 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
          <div>
            {files.length} 个项目
          </div>
          <div>
            {nodeIp ? `远程节点: ${nodeIp}:${nodePort}` : '本地文件系统'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileBrowser;
