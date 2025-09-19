import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

const JobCreator = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (event) => {
    try {
      console.log('文件选择事件触发');
      
      // 检查是否有选择文件
      if (!event.target.files || event.target.files.length === 0) {
        console.log('没有选择文件');
        return;
      }
      
      const selectedFile = event.target.files[0];
      console.log('选择的文件:', selectedFile.name, '类型:', selectedFile.type, '大小:', selectedFile.size);
      
      // 验证文件类型
      if (selectedFile && (selectedFile.name.endsWith('.yaml') || selectedFile.name.endsWith('.yml'))) {
        setFile(selectedFile);
        setResult(null);
        console.log('文件已设置:', selectedFile.name);
      } else {
        console.warn('文件类型不正确');
        alert('请选择一个 YAML 文件 (.yaml 或 .yml)');
        event.target.value = '';
      }
    } catch (error) {
      console.error('文件选择错误:', error);
      alert('选择文件时出错: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('请先选择一个 YAML 文件');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log('正在上传文件:', file.name);
      
      const response = await fetch('/create-vc-job', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('上传结果:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setResult(data);
    } catch (error) {
      console.error('创建任务失败:', error);
      setResult({
        error: '创建任务失败: ' + error.message
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">创建 Volcano 任务</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 文件上传区域 */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
            onClick={() => document.getElementById('yaml-file').click()}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <FileText className="w-12 h-12 text-gray-400" />
              </div>
              <div>
                <div className="cursor-pointer">
                  <span className="text-lg font-medium text-gray-900">选择 YAML 文件</span>
                  <p className="text-sm text-gray-500 mt-1">
                    支持 Volcano Job、Pod、Deployment 等 Kubernetes 资源文件
                  </p>
                </div>
                <input
                  id="yaml-file"
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
              {file ? (
                <div className="flex items-center justify-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>已选择: {file.name}</span>
                </div>
              ) : (
                <button 
                  type="button"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('yaml-file').click();
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  浏览文件
                </button>
              )}
            </div>
          </div>

          {/* 示例 YAML */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">示例 Volcano Job YAML:</h3>
            <pre className="text-xs text-gray-600 overflow-x-auto">
{`apiVersion: batch.volcano.sh/v1alpha1
kind: Job
metadata:
  name: test-job
spec:
  minAvailable: 1
  schedulerName: volcano
  tasks:
  - replicas: 1
    name: "test"
    template:
      spec:
        containers:
        - image: alpine
          name: test
          command: ["/bin/sh"]
          args: ["-c", "sleep 10"]
        restartPolicy: Never`}
            </pre>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  创建中...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  创建任务
                </>
              )}
            </button>
          </div>

          {/* 结果显示 */}
          {result && (
            <div className={`rounded-lg p-4 ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-start">
                {result.error ? (
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${result.error ? 'text-red-800' : 'text-green-800'}`}>
                    {result.error ? '创建失败' : '创建成功'}
                  </h4>
                  <p className={`text-sm mt-1 ${result.error ? 'text-red-700' : 'text-green-700'}`}>
                    {result.error || result.status}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCreator;
