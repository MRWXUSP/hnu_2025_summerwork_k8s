from fastapi import FastAPI
from fastapi import Query
from fastapi import Body
from kubernetes import client, config
import subprocess
import datetime


app = FastAPI()

@app.get("/k8s-clusters")
def get_k8s_clusters():
    from kubernetes import config
    contexts, active_context = config.list_kube_config_contexts()
    clusters = [c['name'] for c in contexts]
    return {"clusters": clusters, "active": active_context['name']}
    

@app.get("/nodes")
def get_nodes():
    """
    获取所有节点信息
    """
    config.load_kube_config()  # 如果在集群外运行
    v1 = client.CoreV1Api()
    nodes = []
    for item in v1.list_node().items:
        node_info = {
            "NAME": item.metadata.name,
            "STATUS": item.status.conditions[-1].type if item.status.conditions else "",
            "ROLES": item.metadata.labels.get("kubernetes.io/role", ""),
            "VERSION": item.status.node_info.kubelet_version,
            "INTERNAL-IP": next((addr.address for addr in item.status.addresses if addr.type == "InternalIP"), ""),
            "EXTERNAL-IP": next((addr.address for addr in item.status.addresses if addr.type == "ExternalIP"), ""),
            "OS-IMAGE": item.status.node_info.os_image,
            "KERNEL-VERSION": item.status.node_info.kernel_version,
            "CONTAINER-RUNTIME": item.status.node_info.container_runtime_version,
        }
        nodes.append(node_info)
    return {"nodes": nodes}

@app.get("/cluster-nodes")
def get_cluster_nodes(cluster: str = Query(...)):
    """
    根据集群名称（context）获取该集群的所有节点信息
    """
    contexts, active_context = config.list_kube_config_contexts()
    context_names = [c['name'] for c in contexts]
    if cluster not in context_names:
        return {"error": f"集群 {cluster} 不存在"}
    config.load_kube_config(context=cluster)
    v1 = client.CoreV1Api()
    nodes = []
    for item in v1.list_node().items:
        node_info = {
            "NAME": item.metadata.name,
            "STATUS": item.status.conditions[-1].type if item.status.conditions else "",
            "ROLES": item.metadata.labels.get("kubernetes.io/role", ""),
            "VERSION": item.status.node_info.kubelet_version,
            "INTERNAL-IP": next((addr.address for addr in item.status.addresses if addr.type == "InternalIP"), ""),
            "EXTERNAL-IP": next((addr.address for addr in item.status.addresses if addr.type == "ExternalIP"), ""),
            "OS-IMAGE": item.status.node_info.os_image,
            "KERNEL-VERSION": item.status.node_info.kernel_version,
            "CONTAINER-RUNTIME": item.status.node_info.container_runtime_version,
        }
        nodes.append(node_info)
    return {"nodes": nodes}




# 查询当前主机上的所有 Docker 镜像，返回镜像名:tag、镜像ID、创建时间、大小等信息
@app.get("/docker-images")
def get_docker_images():
    try:
        result = subprocess.run(
            ["docker", "images", "--format", "{{.Repository}}:{{.Tag}} {{.ID}} {{.CreatedAt}} {{.Size}}"],
            capture_output=True, text=True, check=True
        )
        images = []
        for line in result.stdout.strip().split("\n"):
            parts = line.split()
            if len(parts) >= 4:
                image_info = {
                    "REPOSITORY:TAG": parts[0],
                    "IMAGE ID": parts[1],
                    "CREATED AT": " ".join(parts[2:-1]),
                    "SIZE": parts[-1]
                }
                images.append(image_info)
        return {"images": images}
    except subprocess.CalledProcessError as e:
        return {"error": str(e), "output": e.output, "stderr": e.stderr}
    
@app.post("/load-image-to-cluster")
def load_image_to_cluster(
    image: str = Body(..., embed=True),
    cluster: str = Body(..., embed=True)
):
    """
    将本地 Docker 镜像加载到指定 kind 集群
    """
    #去掉前置可能存在的kind，如：kind-dl-cluster变为dl-cluster
    cluster = cluster.replace("kind-", "")

    try:
        result = subprocess.run(
            ["kind", "load", "docker-image", image, "--name", cluster],
            capture_output=True, text=True, check=True
        )
        return {"success": True, "output": result.stdout, "stderr": result.stderr}
    except subprocess.CalledProcessError as e:
        return {"success": False, "error": str(e), "output": e.output, "stderr": e.stderr}
    



# 获取所有Pod列表
@app.get("/pods")
def get_pods():
    pods = []
    v1 = client.CoreV1Api()
    ret = v1.list_pod_for_all_namespaces(watch=False)
    for item in ret.items:
        pod_info = {
            "NAMESPACE": item.metadata.namespace,
            "NAME": item.metadata.name,
            "READY": f"{sum(1 for c in item.status.container_statuses if c.ready)}/{len(item.status.container_statuses)}" if item.status.container_statuses else "0/0",
            "STATUS": item.status.phase,
            "RESTARTS": sum(c.restart_count for c in item.status.container_statuses) if item.status.container_statuses else 0,
            "AGE": str(item.metadata.creation_timestamp)
        }
        pods.append(pod_info)
    return {"pods": pods}

# 获取指定Pod的日志
@app.get("/pod-logs")
def get_pod_logs(
    pod_name: str = Query(..., description="Pod名称"),
    namespace: str = Query("default", description="命名空间名称"),
    container: str = Query(None, description="容器名称（如果Pod中有多个容器）"),
    tail_lines: int = Query(100, description="返回的日志行数", ge=1, le=5000)
):
    """
    获取指定Pod的日志
    """
    try:
        config.load_kube_config()  # 如果在集群外运行
        v1 = client.CoreV1Api()
        
        # 获取Pod信息，检查是否存在
        try:
            pod = v1.read_namespaced_pod(name=pod_name, namespace=namespace)
        except client.exceptions.ApiException as e:
            if e.status == 404:
                return {"error": f"Pod {pod_name} 在命名空间 {namespace} 中不存在"}
            raise e
        
        # 如果没有指定容器，但Pod有多个容器，则使用第一个容器
        if not container and pod.spec.containers and len(pod.spec.containers) > 1:
            container = pod.spec.containers[0].name
            
        # 获取日志
        logs = v1.read_namespaced_pod_log(
            name=pod_name,
            namespace=namespace,
            container=container,
            tail_lines=tail_lines
        )
        
        # 将日志按行分割
        log_lines = logs.split('\n') if logs else []
        
        return {
            "pod": pod_name,
            "namespace": namespace,
            "container": container,
            "log_lines": log_lines,
            "total_lines": len(log_lines)
        }
    except client.exceptions.ApiException as e:
        return {"error": f"API错误: {str(e)}"}
    except Exception as e:
        return {"error": f"获取日志失败: {str(e)}"}



# 获取所有deployment列表
@app.get("/deployments")
def get_deployments():
    apps_v1 = client.AppsV1Api()
    deployments = []
    ret = apps_v1.list_deployment_for_all_namespaces(watch=False)
    for item in ret.items:
        deploy_info = {
            "NAMESPACE": item.metadata.namespace,
            "NAME": item.metadata.name,
            "READY": f"{item.status.ready_replicas}/{item.status.replicas}" if item.status.replicas else "0/0",
            "UP-TO-DATE": item.status.updated_replicas if item.status.updated_replicas else 0,
            "AVAILABLE": item.status.available_replicas if item.status.available_replicas else 0,
            "AGE": str(item.metadata.creation_timestamp)
        }
        deployments.append(deploy_info)
    return {"deployments": deployments}

# 获取所有service列表
@app.get("/services")
def get_services():
    services = []
    v1 = client.CoreV1Api()
    ret = v1.list_service_for_all_namespaces(watch=False)
    for item in ret.items:
        ports = ", ".join([f"{p.port}:{p.node_port}" if p.node_port else str(p.port) for p in item.spec.ports])
        svc_info = {
            "NAMESPACE": item.metadata.namespace,
            "NAME": item.metadata.name,
            "TYPE": item.spec.type,
            "CLUSTER-IP": item.spec.cluster_ip,
            "EXTERNAL-IP": item.status.load_balancer.ingress[0].ip if item.status.load_balancer and item.status.load_balancer.ingress else "",
            "PORT(S)": ports,
            "AGE": str(item.metadata.creation_timestamp)
        }
        services.append(svc_info)
    return {"services": services}

# 停止全部Pod
@app.post("/stop-all-pods")
def stop_all_pods():
    v1 = client.CoreV1Api()
    ret = v1.list_namespaced_pod(namespace="default", watch=False)
    for item in ret.items:
        try:
            v1.delete_namespaced_pod(name=item.metadata.name, namespace="default")
        except Exception as e:
            return {"error": str(e)}
    return {"status": "Default namespace pods deletion initiated"}

# 停止全部deployment
@app.post("/stop-all-deployments")
def stop_all_deployments():
    apps_v1 = client.AppsV1Api()
    ret = apps_v1.list_namespaced_deployment(namespace="default", watch=False)
    for item in ret.items:
        try:
            apps_v1.delete_namespaced_deployment(name=item.metadata.name, namespace="default")
        except Exception as e:
            return {"error": str(e)}
    return {"status": "Default namespace deployments deletion initiated"}

# 停止全部service
@app.post("/stop-all-services")
def stop_all_services():
    v1 = client.CoreV1Api()
    ret = v1.list_namespaced_service(namespace="default", watch=False)
    for item in ret.items:
        if item.metadata.name == "kubernetes":
            continue  # 不删除默认的 kubernetes 服务
        try:
            v1.delete_namespaced_service(name=item.metadata.name, namespace="default")
        except Exception as e:
            return {"error": str(e)}
    return {"status": "Default namespace services deletion initiated"}

# 创建vc任务，需要提交yaml文件
from fastapi import File, UploadFile

# 创建vc任务，需要上传yaml文件（multipart/form-data）
@app.post("/create-vc-job")
def create_vc_job(file: UploadFile = File(...)):
    import yaml
    from kubernetes.utils import create_from_dict
    try:
        content = file.file.read().decode()
        docs = list(yaml.safe_load_all(content))
        created = 0
        for data in docs:
            if data:
                create_from_dict(client.ApiClient(), data)
                created += 1
        return {"status": f"{created} document(s) created successfully"}
    except Exception as e:
        return {"error": str(e)}
    
# 检查节点状态
# 通过节点内部的api端口访问
# IP、端口号由用户给出
@app.get("/check-node-status")
def check_node_status(ip: str = Query(...), port: int = Query(...)):
    import requests
    try:
        url = f"http://{ip}:{port}/health/"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return {"status": "reachable", "data": response.json()}
        else:
            return {"status": "unreachable", "http_status": response.status_code}
    except Exception as e:
        return {"status": "error", "error": str(e)}
    
# 清空workspace
# 通过节点内部的api端口访问
# IP、端口号由用户给出
@app.post("/clear-workspace")
def clear_workspace(ip: str = Body(...), port: int = Body(...)):
    import requests
    try:
        url = f"http://{ip}:{port}/clear-workspace/"
        response = requests.post(url, timeout=10)
        if response.status_code == 200:
            return {"status": "success", "data": response.json()}
        else:
            return {"status": "failed", "http_status": response.status_code, "data": response.text}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# 下发算法
# 通过节点内部的api端口访问
# IP、端口号由用户给出
@app.post("/upload-algo")
def upload_algo(ip: str = Body(...), port: int = Body(...), file: UploadFile = File(...)):
    import requests
    try:
        url = f"http://{ip}:{port}/upload-algo/"
        files = {'file': (file.filename, file.file, file.content_type)}
        response = requests.post(url, files=files, timeout=30)
        if response.status_code == 200:
            return {"status": "success", "data": response.json()}
        else:
            return {"status": "failed", "http_status": response.status_code, "data": response.text}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# 返回节点的计算资源利用情况
# 通过节点内部的api端口访问
# IP、端口号由用户给出
@app.get("/get-resource-usage")
def get_resource_usage(ip: str = Query(...), port: int = Query(...)):
    import requests
    try:
        url = f"http://{ip}:{port}/resource-usage/"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return {"status": "success", "data": response.json()}
        else:
            return {"status": "failed", "http_status": response.status_code, "data": response.text}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# 获取最近的终端输出
# 通过节点内部的api端口访问
# IP、端口号由用户给出
@app.get("/get-logs")
def get_logs(ip: str = Query(...), port: int = Query(...), lines: int = Query(50)):
    import requests
    try:
        url = f"http://{ip}:{port}/logs/?lines={lines}"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return {"status": "success", "data": response.json()}
        else:
            return {"status": "failed", "http_status": response.status_code, "data": response.text}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# 执行终端命令
# 通过节点内部的api端口访问
# IP、端口号由用户给出
@app.post("/exec-command")
def exec_command(ip: str = Body(...), port: int = Body(...), cmd: str = Body(...)):
    import requests
    try:
        url = f"http://{ip}:{port}/exec/"
        data = {'cmd': cmd}
        response = requests.post(url, data=data, timeout=10)
        if response.status_code == 200:
            return {"status": "success", "data": response.json()}
        else:
            return {"status": "failed", "http_status": response.status_code, "data": response.text}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# 中断子进程
# 通过节点内部的api端口访问
# IP、端口号由用户给出
@app.post("/interrupt-process")
def interrupt_process(ip: str = Body(...), port: int = Body(...)):
    import requests
    try:
        url = f"http://{ip}:{port}/interrupt/"
        response = requests.post(url, timeout=5)
        if response.status_code == 200:
            return {"status": "success", "data": response.json()}
        else:
            return {"status": "failed", "http_status": response.status_code, "data": response.text}
    except Exception as e:
        return {"status": "error", "error": str(e)}

# 获得工作空间某个文件
# 或者文件夹内容索引
# 通过节点内部的api端口访问
# IP、端口号由用户给出
'''
@app.get("/list-files/")
async def list_files(path: str = ""):
    """获得工作空间某个文件/文件夹索引"""
    target_path = os.path.join(WORKSPACE, path)
    if not os.path.exists(target_path):
        return JSONResponse(status_code=404, content={"error": "Path not found"})

    if os.path.isfile(target_path):
        return FileResponse(target_path)

    files = os.listdir(target_path)
    return {"files": files}
'''
from fastapi.responses import Response

from fastapi.responses import Response

@app.get("/list-files")
def list_files(ip: str = Query(...), port: int = Query(...), path: str = Query("")):
    import requests
    try:
        url = f"http://{ip}:{port}/list-files/?path={path}"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            content_type = response.headers.get("content-type", "")
            # 如果远程返回的是文件内容，直接返回原始内容
            if content_type.startswith("application/octet-stream") or content_type.startswith("text/"):
                return Response(content=response.content, media_type=content_type)
            # 如果是 JSON，则解析并返回
            return {"status": "success", "data": response.json()}
        else:
            return {"status": "failed", "http_status": response.status_code, "data": response.text}
    except Exception as e:
        return {"status": "error", "error": str(e)}
    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8500)