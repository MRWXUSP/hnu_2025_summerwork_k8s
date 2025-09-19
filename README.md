# hnu2025夏季学期大作业——volcano算力调度
---
## 项目简介

本项目是一个基于React的Kubernetes管理平台，主要用于管理Kubernetes集群中的资源。

注意，本项目只用于本地化部署，用于生产环境请自行修改。

仓库有两个分支：
- main: react ui部分
- back: 后端相关

你现在所查看的是back分支，请在main分支查看react ui部分。

## 项目结构

```
|-- MNIST  # 手写数字识别项目相关
    |-- mnist_jpg       # 数据集，仓库中不予提供，请前往release下载
    |-- dockerfile      # 节点训练、预测容器镜像
    |-- main.py         # 节点api相关，部署到节点中
    |-- requirements.txt  # 镜像依赖
    |-- train.py        # 训练代码
    |-- predict.py      # 预测代码
    |-- test_7_9.jpg    # 测试图片
|-- webui  # web ui部分
    |-- react_k8s  # react ui部分，在main分支
    |-- api.py      # web ui后端api
|-- kind-config-large.yaml  # kind集群配置文件
|-- train-predict.yaml  # 训练、预测节点部署文件
|-- README.md  # 本文件
```

## 部署流程

请先部署后端代码，再部署web ui，具体流程参考back分支README与main分支实验报告。

具体部署流程在main分支中的实验报告中有详细介绍。

1. 参照上文项目结构，构建完整项目
2. 部署kind集群
3. 部署训练、预测节点
4. 部署web ui
5. 访问web ui，测试手写数字识别功能