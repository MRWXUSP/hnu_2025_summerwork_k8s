import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Terminal as TerminalIcon, Send, RefreshCw, Play, Pause } from 'lucide-react';
import { ensureValidPort, parsePort } from '../utils/portUtils';

const TerminalExecutor = ({ isOpen, onClose }) => {
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('30081');
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedNodes, setSavedNodes] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(2000); // 2秒轮询一次
  const [lastCommandTime, setLastCommandTime] = useState(null);
  const outputEndRef = useRef(null);
  const inputRef = useRef(null);
  const pollingRef = useRef(null);

  // 全局错误处理
  const handleError = useCallback((error, context = '') => {
    console.error(`终端错误 ${context ? `(${context})` : ''}:`, error);
    setOutput(prev => [...prev, { 
      type: 'error', 
      content: `错误: ${context ? `[${context}] ` : ''}${error.message || String(error)}` 
    }]);
  }, []);

  // 加载保存的节点端口信息
  useEffect(() => {
    const loadSavedNodes = () => {
      try {
        const nodes = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nodePort_')) {
            const nodeIp = key.replace('nodePort_', '');
            const nodePort = localStorage.getItem(key);
            nodes[nodeIp] = nodePort;
          }
        }
        setSavedNodes(nodes);
        
        // 如果有保存的节点，默认选择第一个
        const nodeIps = Object.keys(nodes);
        if (nodeIps.length > 0) {
          setIp(nodeIps[0]);
          setPort(nodes[nodeIps[0]]);
        }
      } catch (error) {
        handleError(error, '加载节点信息');
      }
    };
    
    loadSavedNodes();
  }, [handleError]);

  // 自动滚动到输出底部
  useEffect(() => {
    if (outputEndRef.current) {
      outputEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [output]);

  // 当弹窗打开时，聚焦到输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 获取命令输出日志
  const fetchLogs = useCallback(async () => {
    if (!ip.trim() || !port.trim()) return;
    
    try {
      // 确保端口号有效
      const validPort = ensureValidPort(port);
      const portNum = parsePort(validPort);
      if (!portNum) {
        handleError(new Error(`端口号无效: ${port}`), '获取日志');
        return;
      }
      
      // 使用修复后的端口号
      console.log(`获取日志使用端口: ${portNum}`);
      const response = await fetch(`/get-logs?ip=${encodeURIComponent(ip)}&port=${portNum}&lines=50`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status === 'success' && result.data) {
        // 处理日志内容
        let logContent = '';
        
        // 确保logs是有效的数据，并转换为字符串
        if (result.data.logs) {
          if (Array.isArray(result.data.logs)) {
            logContent = result.data.logs.join('\n');
          } else if (typeof result.data.logs === 'string') {
            logContent = result.data.logs;
          } else {
            logContent = String(result.data.logs);
          }
        }
        
        if (logContent) {
          // 更新输出 - 找到最后一个命令，并替换或添加其后的输出
          setOutput(prev => {
            // 找到最后一个命令
            const lastCommandIndex = [...prev].reverse().findIndex(item => item.type === 'command');
            
            if (lastCommandIndex === -1) {
              // 没有找到命令，直接替换所有非命令输出
              const commandsOnly = prev.filter(item => item.type === 'command');
              return [...commandsOnly, { type: 'output', content: logContent }];
            } else {
              // 找到了命令
              const reverseIndex = lastCommandIndex;
              const actualIndex = prev.length - 1 - reverseIndex;
              
              // 保留所有命令和最后一个命令之前的输出
              const newOutput = prev.slice(0, actualIndex + 1);
              
              // 添加新的输出
              newOutput.push({ type: 'output', content: logContent });
              
              return newOutput;
            }
          });
        }
      }
    } catch (error) {
      handleError(error, '获取日志');
    }
  }, [ip, port, handleError]);

  // 设置轮询机制
  useEffect(() => {
    if (isOpen && ip && port) {
      // 清除之前的轮询
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
      
      if (autoRefresh) {
        // 添加自动刷新开始提示
        setOutput(prev => {
          // 检查是否已经有自动刷新提示
          const hasRefreshMessage = prev.some(item => 
            item.type === 'info' && item.content.includes('自动刷新已开启')
          );
          
          if (!hasRefreshMessage) {
            return [...prev, {
              type: 'info',
              content: `[${new Date().toLocaleTimeString()}] 自动刷新已开启，间隔 ${refreshInterval/1000} 秒`
            }];
          }
          return prev;
        });
        
        // 设置新的轮询
        pollingRef.current = setInterval(fetchLogs, refreshInterval);
        
        // 立即执行一次
        fetchLogs();
      } else {
        // 添加自动刷新停止提示
        setOutput(prev => {
          // 检查最后一条消息是否是自动刷新相关
          const lastItem = prev[prev.length - 1];
          if (lastItem && lastItem.type === 'info' && lastItem.content.includes('自动刷新')) {
            // 替换最后一条消息
            const newOutput = [...prev.slice(0, -1)];
            newOutput.push({
              type: 'info',
              content: `[${new Date().toLocaleTimeString()}] 自动刷新已停止`
            });
            return newOutput;
          }
          
          return [...prev, {
            type: 'info',
            content: `[${new Date().toLocaleTimeString()}] 自动刷新已停止`
          }];
        });
      }
    }
    
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, autoRefresh, ip, port, refreshInterval, fetchLogs]);

  // 执行命令
  const executeCommand = async () => {
    if (!command.trim() || !ip.trim() || !port.trim()) return;
    
    setLoading(true);
    
    // 添加命令到历史记录和输出
    const timestamp = new Date().toLocaleTimeString();
    const cmdWithPrompt = `[${timestamp}] $ ${command}`;
    setOutput(prev => [...prev, { type: 'command', content: cmdWithPrompt }]);
    
    // 添加到命令历史
    setCommandHistory(prev => [command, ...prev].slice(0, 50));
    setHistoryIndex(-1);
    
    // 记录命令执行时间
    setLastCommandTime(new Date());
    
    try {
      // 确保端口号有效
      const validPort = ensureValidPort(port);
      const portNum = parsePort(validPort);
      if (!portNum) {
        throw new Error(`端口号无效: ${port}`);
      }
      
      // 验证命令不为空
      if (!command.trim()) {
        throw new Error('命令不能为空');
      }
      
      // 使用修复后的端口号
      console.log(`执行命令使用端口: ${portNum}`);
      const response = await fetch('/exec-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip,
          port: portNum,
          cmd: command
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.status !== 'success') {
        // 添加错误信息到终端
        setOutput(prev => [...prev, { 
          type: 'error', 
          content: `错误: ${result.error || result.data || '未知错误'}` 
        }]);
      }
      
      // 执行命令后立即获取日志
      await fetchLogs();
      
    } catch (error) {
      handleError(error, '执行命令');
    } finally {
      setLoading(false);
      setCommand('');
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e) => {
    // 按上下键浏览命令历史
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCommand(commandHistory[newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommand('');
      }
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand();
    }
  };

  // 处理节点选择
  const handleNodeSelect = (e) => {
    const selectedIp = e.target.value;
    setIp(selectedIp);
    if (savedNodes[selectedIp]) {
      setPort(savedNodes[selectedIp]);
    }
  };

  // 清空终端
  const clearTerminal = () => {
    setOutput([{
      type: 'info',
      content: `[${new Date().toLocaleTimeString()}] 终端已清空`
    }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-11/12 max-w-4xl h-[80vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="bg-gray-800 text-white p-3 flex items-center justify-between">
          <div className="flex items-center">
            <TerminalIcon className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">终端执行器</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* 节点选择和命令输入区域 */}
        <div className="bg-gray-100 p-3 border-b border-gray-300">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">节点IP</label>
              <div className="flex">
                <select
                  value={ip}
                  onChange={handleNodeSelect}
                  className="flex-1 rounded-l-md border-r-0 border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                >
                  <option value="">选择节点</option>
                  {Object.keys(savedNodes).map(nodeIp => (
                    <option key={nodeIp} value={nodeIp}>{nodeIp}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={ip}
                  onChange={(e) => setIp(e.target.value)}
                  placeholder="节点IP地址"
                  className="flex-1 rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">端口</label>
              <input
                type="text"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="端口号"
                className="rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm"
              />
            </div>
            <div className="flex flex-col justify-end space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`py-1 px-2 rounded-md text-sm flex items-center ${
                    autoRefresh 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {autoRefresh ? (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      停止自动刷新
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      启动自动刷新
                    </>
                  )}
                </button>
                {autoRefresh && (
                  <select
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    className="rounded-md border-gray-300 py-1 text-sm"
                  >
                    <option value={1000}>1秒</option>
                    <option value={2000}>2秒</option>
                    <option value={5000}>5秒</option>
                    <option value={10000}>10秒</option>
                  </select>
                )}
              </div>
              <button
                onClick={clearTerminal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-2 rounded-md text-sm flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                清空终端
              </button>
            </div>
          </div>
          
          {/* 状态指示器 */}
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <div className={`w-2 h-2 rounded-full mr-1 ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span>
              {autoRefresh 
                ? `自动刷新已开启 (${refreshInterval/1000}秒)` 
                : '自动刷新已关闭'}
            </span>
            {lastCommandTime && (
              <span className="ml-4">
                最后命令执行时间: {lastCommandTime.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        
        {/* 终端输出区域 */}
        <div className="flex-1 bg-black text-green-400 p-4 font-mono text-sm overflow-y-auto">
          {output.length === 0 ? (
            <div className="text-gray-500 italic">
              终端就绪，请输入命令...
              {autoRefresh && (
                <div className="mt-2">
                  <div className="inline-block w-2 h-2 bg-green-500 rounded-full animate-ping mr-1"></div>
                  正在监听输出...
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {output.map((item, index) => (
                <div key={index}>
                  {item.type === 'command' && (
                    <div className="flex items-center bg-gray-800 px-2 py-1 rounded-t border-l-2 border-cyan-500">
                      <span className="text-cyan-300 font-bold">{item.content}</span>
                    </div>
                  )}
                  {item.type === 'output' && (
                    <div className="bg-black border border-gray-800 p-2 rounded-b whitespace-pre-wrap text-green-400">
                      {item.content || <span className="text-gray-500 italic">（无输出）</span>}
                    </div>
                  )}
                  {item.type === 'error' && (
                    <div className="bg-red-900 bg-opacity-20 p-2 rounded border border-red-800 whitespace-pre-wrap text-red-400">
                      {item.content}
                    </div>
                  )}
                  {item.type === 'info' && (
                    <div className="bg-blue-900 bg-opacity-10 p-2 rounded border border-blue-800 whitespace-pre-wrap text-blue-400 text-center italic">
                      {item.content}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          <div ref={outputEndRef} />
        </div>
        
        {/* 命令输入区域 */}
        <div className="bg-gray-900 p-2">
          <div className="flex items-center">
            <div className="text-green-400 mr-2 flex items-center">
              <span className="text-gray-500 mr-1">{ip ? ip : 'localhost'}</span>
              <span>$</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入命令..."
              className="flex-1 bg-transparent text-green-400 border-none focus:ring-0 focus:outline-none"
              disabled={loading || !ip.trim() || !port.trim()}
            />
            <button
              onClick={executeCommand}
              disabled={loading || !command.trim() || !ip.trim() || !port.trim()}
              className={`ml-2 p-2 rounded-full ${
                loading || !command.trim() || !ip.trim() || !port.trim() 
                  ? 'bg-gray-700 text-gray-400' 
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title="执行命令"
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* 提示信息 */}
          <div className="mt-1 text-xs text-gray-500 flex justify-between">
            <div>
              {!ip.trim() || !port.trim() ? (
                <span className="text-yellow-500">请先选择节点和端口</span>
              ) : (
                <span>按 Enter 执行命令，↑↓ 浏览历史</span>
              )}
            </div>
            <div>
              {commandHistory.length > 0 && (
                <span>{commandHistory.length} 条历史命令</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalExecutor;
