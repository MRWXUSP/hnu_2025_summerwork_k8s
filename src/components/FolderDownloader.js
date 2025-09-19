import React, { useState, useEffect, useCallback } from 'react';
import { 
  Folder, 
  File, 
  X,
  AlertCircle,
  Check,
  Loader
} from 'lucide-react';
import { ensureValidPort, parsePort } from '../utils/portUtils';

const FolderDownloader = ({ isOpen, onClose, folderPath, nodeIp, nodePort = '30081' }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadQueue, setDownloadQueue] = useState([]);
  const [downloadedFiles, setDownloadedFiles] = useState([]);
  const [currentDownload, setCurrentDownload] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState('idle'); // idle, preparing, downloading, completed, error
  // 确保初始端口号有效
  const [customPort, setCustomPort] = useState(() => ensureValidPort(nodePort, '30081'));

  // 当端口变化时更新customPort
  useEffect(() => {
    // 确保端口号有效
    setCustomPort(ensureValidPort(nodePort, '30081'));
  }, [nodePort]);

  // 递归获取文件夹内所有文件
  const fetchFolderContents = useCallback(async (path, fileList = []) => {
    if (!nodeIp) {
      throw new Error("请选择一个节点");
    }
    
    try {
      // 确保端口号有效
      const validPort = ensureValidPort(customPort);
      const portNum = parsePort(validPort);
      if (!portNum) {
        throw new Error(`端口号无效: ${customPort}`);
      }
      
      // 使用修复后的端口号
      console.log(`获取文件夹内容使用端口: ${portNum}`);
      const url = `/list-files?ip=${encodeURIComponent(nodeIp)}&port=${portNum}&path=${encodeURIComponent(path)}`;
      
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // 处理文件列表
      let items = [];
      if (data.files) {
        items = data.files;
      } else if (data.data && data.data.files) {
        items = data.data.files;
      }
      
      // 遍历所有项目（周期性让步，避免长时间阻塞）
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const itemPath = path ? `${path}/${item}` : item;
        
        // 判断是文件还是文件夹
        const isDirectory = !item.includes('.');
        
        if (isDirectory) {
          // 如果是文件夹，递归获取内容
          await fetchFolderContents(itemPath, fileList);
        } else {
          // 如果是文件，添加到列表
          fileList.push({
            name: item,
            path: itemPath,
            fullPath: itemPath,
            downloaded: false
          });
        }

        // 每处理一定数量条目后让出事件循环，缓解卡顿
        if (idx % 25 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      return fileList;
    } catch (error) {
      throw error;
    }
  }, [nodeIp, customPort]);

  // 初始化下载队列
  useEffect(() => {
    const initDownload = async () => {
      if (isOpen && folderPath) {
        setLoading(true);
        setError(null);
        setDownloadStatus('preparing');
        
        try {
          const allFiles = await fetchFolderContents(folderPath);
          setFiles(allFiles);
          setDownloadQueue(allFiles);
          setDownloadProgress(0);
          setDownloadedFiles([]);
          // 准备完成，允许用户点击开始下载
          setDownloadStatus('idle');
        } catch (error) {
          setError(`获取文件列表失败: ${error.message}`);
          setDownloadStatus('error');
        } finally {
          setLoading(false);
        }
      }
    };
    
    initDownload();
  }, [isOpen, folderPath, fetchFolderContents]);

  // 处理下载队列（分批+让步，避免主线程长时间阻塞）
  useEffect(() => {
    const processDownloadQueue = async () => {
      if (downloadStatus !== 'downloading' || downloadQueue.length === 0) return;
      
      // 一次处理的批量大小
      const batchSize = 5;
      const batch = downloadQueue.slice(0, batchSize);
      
      for (let i = 0; i < batch.length; i++) {
        const fileToDownload = batch[i];
        setCurrentDownload(fileToDownload);
        
        try {
        // 确保端口号有效
        const validPort = ensureValidPort(customPort);
        const portNum = parsePort(validPort);
        if (!portNum) {
          throw new Error(`端口号无效: ${customPort}`);
        }
        
        // 使用修复后的端口号
        console.log(`下载队列文件使用端口: ${portNum}`);
        const url = `/list-files?ip=${encodeURIComponent(nodeIp)}&port=${portNum}&path=${encodeURIComponent(fileToDownload.path)}`;
        
        const response = await fetch(url);
        
        // 检查响应状态
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // 检查是否是文件下载响应
        const contentType = response.headers.get('content-type');
        if (contentType && (contentType.startsWith('application/octet-stream') || contentType.startsWith('text/'))) {
          // 获取文件内容
          const blob = await response.blob();
          
          // 创建下载链接
          const downloadUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = fileToDownload.name;
          document.body.appendChild(a);
          a.click();
          
          // 清理
          window.URL.revokeObjectURL(downloadUrl);
          document.body.removeChild(a);
          
          // 更新下载状态
            setDownloadedFiles(prev => [...prev, fileToDownload]);
            setDownloadQueue(prev => prev.slice(1));
          
          // 更新进度
          const progress = Math.round(((downloadedFiles.length + 1) / files.length) * 100);
          setDownloadProgress(progress);
        } else {
          throw new Error(`无法下载文件: ${fileToDownload.name} (不是有效的文件响应)`);
        }
        } catch (error) {
          console.error(`下载文件失败: ${fileToDownload.name}`, error);
          // 跳过这个文件，继续下载下一个
          setDownloadQueue(prev => prev.slice(1));
        } finally {
          setCurrentDownload(null);
        }
        // 在每个文件完成后让出事件循环，避免长时间阻塞
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    };
    
    processDownloadQueue();
  }, [downloadStatus, downloadQueue, downloadedFiles, files.length, nodeIp, customPort]);

  // 检查下载是否完成
  useEffect(() => {
    if (downloadStatus === 'downloading' && downloadQueue.length === 0 && files.length > 0) {
      setDownloadStatus('completed');
    }
  }, [downloadStatus, downloadQueue, files.length]);

  // 开始下载
  const startDownload = () => {
    if (files.length > 0) {
      setDownloadStatus('downloading');
    }
  };

  // 取消下载
  const cancelDownload = () => {
    setDownloadStatus('idle');
    setDownloadQueue([]);
    setCurrentDownload(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-lg overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
          <div className="flex items-center">
            <Folder className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">文件夹下载</h2>
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
                disabled={downloadStatus !== 'idle'}
              />
            </div>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="p-4">
          {error ? (
            <div className="p-4 mb-4 bg-red-100 text-red-800 border-l-4 border-red-500 rounded flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <div>
                <p className="font-medium">错误</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center p-8">
              <Loader className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-gray-600">正在准备文件列表...</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-1">下载文件夹</h3>
                <p className="text-gray-600 text-sm">{folderPath || '/'}</p>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">文件总数: {files.length}</span>
                  <span className="text-sm font-medium">已下载: {downloadedFiles.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${downloadProgress}%` }}
                  ></div>
                </div>
              </div>
              
              {downloadStatus === 'idle' && (
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    准备下载 <span className="font-medium">{files.length}</span> 个文件。
                  </p>
                  <p className="text-sm text-gray-600">
                    点击"开始下载"按钮开始下载文件。
                  </p>
                </div>
              )}
              
              {downloadStatus === 'downloading' && currentDownload && (
                <div className="bg-blue-50 p-3 rounded-lg mb-4 animate-pulse">
                  <p className="text-sm text-blue-600 flex items-center">
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    正在下载: {currentDownload.name}
                  </p>
                </div>
              )}
              
              {downloadStatus === 'completed' && (
                <div className="bg-green-50 p-3 rounded-lg mb-4">
                  <p className="text-sm text-green-600 flex items-center">
                    <Check className="w-4 h-4 mr-2" />
                    所有文件下载完成!
                  </p>
                </div>
              )}
              
              {/* 文件列表 */}
              <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg mb-4">
                {files.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    文件夹为空
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center p-2 hover:bg-gray-50">
                        <File className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="text-sm truncate flex-1" title={file.fullPath}>
                          {file.fullPath}
                        </span>
                        {downloadedFiles.some(f => f.path === file.path) ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <span className="text-xs text-gray-400">等待下载</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* 底部按钮 */}
        <div className="bg-gray-100 p-3 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={cancelDownload}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200"
          >
            取消
          </button>
          
          {downloadStatus === 'idle' && (
            <button
              onClick={startDownload}
              disabled={files.length === 0 || loading}
              className={`px-4 py-2 rounded-md ${
                files.length === 0 || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              开始下载
            </button>
          )}
          
          {downloadStatus === 'completed' && (
            <button
              onClick={onClose}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              完成
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderDownloader;
