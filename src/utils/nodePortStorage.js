// 节点端口存储工具
// 用于在localStorage中存储和获取节点的端口号

// 保存节点端口号
export const saveNodePort = (nodeIp, port) => {
  try {
    localStorage.setItem(`nodePort_${nodeIp}`, port);
    return true;
  } catch (error) {
    console.error('保存节点端口失败:', error);
    return false;
  }
};

// 获取节点端口号
export const getNodePort = (nodeIp) => {
  try {
    const port = localStorage.getItem(`nodePort_${nodeIp}`);
    return port || '30081'; // 默认端口为30081
  } catch (error) {
    console.error('获取节点端口失败:', error);
    return '30081'; // 默认端口为30081
  }
};

// 获取所有已保存的节点端口
export const getAllNodePorts = () => {
  try {
    const ports = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('nodePort_')) {
        const nodeIp = key.replace('nodePort_', '');
        ports[nodeIp] = localStorage.getItem(key);
      }
    }
    return ports;
  } catch (error) {
    console.error('获取所有节点端口失败:', error);
    return {};
  }
};

// 检查节点是否有保存的端口号
export const hasNodePort = (nodeIp) => {
  try {
    return localStorage.getItem(`nodePort_${nodeIp}`) !== null;
  } catch (error) {
    console.error('检查节点端口失败:', error);
    return false;
  }
};
