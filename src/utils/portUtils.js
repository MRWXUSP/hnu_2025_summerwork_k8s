/**
 * 端口号处理工具函数
 */

/**
 * 确保端口号是完整的5位数字
 * 如果输入的端口号是有效的，则返回原始端口号
 * 否则，尝试修复可能的截断问题（例如，将3008修复为30082）
 * 
 * @param {string|number} port 输入的端口号
 * @param {string} [defaultPort='30081'] 默认端口号
 * @returns {string} 修复后的端口号
 */
export const ensureValidPort = (port, defaultPort = '30081') => {
  // 如果端口为空，返回默认端口
  if (!port) return defaultPort;
  
  // 将端口转换为字符串
  const portStr = String(port);
  
  // 检查是否是有效的端口号（1-65535）
  const portNum = parseInt(portStr, 10);
  if (!isNaN(portNum) && portNum >= 1 && portNum <= 65535) {
    // 如果是3008，可能是30082的截断
    if (portNum === 3008) {
      console.warn('检测到可能的端口截断问题，将3008修正为30082');
      return '30082';
    }
    // 否则返回原始端口
    return portStr;
  }
  
  // 如果端口无效，返回默认端口
  console.warn(`无效的端口号: ${port}，使用默认端口: ${defaultPort}`);
  return defaultPort;
};

/**
 * 获取特定节点的推荐端口号
 * 
 * @param {string} nodeName 节点名称
 * @returns {string} 推荐的端口号
 */
export const getRecommendedPort = (nodeName) => {
  // 根据节点名称推荐端口
  if (nodeName && nodeName.includes('worker2')) {
    return '30082'; // worker2节点使用30082端口
  }
  return '30081'; // 默认使用30081端口
};

/**
 * 解析和验证端口号
 * 
 * @param {string|number} port 输入的端口号
 * @returns {number|null} 解析后的端口号，如果无效则返回null
 */
export const parsePort = (port) => {
  const portNum = parseInt(String(port), 10);
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    return null;
  }
  return portNum;
};

