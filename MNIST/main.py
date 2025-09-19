import os
import shutil
import zipfile
import subprocess
import psutil
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import JSONResponse, FileResponse
import uvicorn
import threading
from collections import deque

app = FastAPI()

# 工作空间路径
WORKSPACE = "/workspace"
os.makedirs(WORKSPACE, exist_ok=True)

# 保存子进程引用
process = None
log_buffer = deque(maxlen=1000)   # 固定长度日志缓冲区
log_lock = threading.Lock()       # 线程锁，避免竞争

def stream_reader(pipe):
    """后台线程：持续读取子进程输出到 log_buffer"""
    global log_buffer
    for line in iter(pipe.readline, b''):
        with log_lock:
            log_buffer.append(line.decode("utf-8"))
    pipe.close()

@app.post("/clear-workspace/")
async def clear_workspace():
    """清空 workspace（但是保留main.py、requirements.txt文件与data文件夹）"""
    if os.path.exists(WORKSPACE):
        for item in os.listdir(WORKSPACE):
            item_path = os.path.join(WORKSPACE, item)
            if item not in ["main.py", "requirements.txt", "data"]:
                if os.path.isfile(item_path):
                    os.remove(item_path)
                else:
                    shutil.rmtree(item_path)
    return {"status": "success", "msg": "Workspace cleared"}

@app.post("/upload-algo/")
async def upload_algo(file: UploadFile):
    """下发算法：清空 workspace + 解压 zip 文件"""
    # 清空 workspace
    if os.path.exists(WORKSPACE):
        for item in os.listdir(WORKSPACE):
            item_path = os.path.join(WORKSPACE, item)
            if item not in ["main.py", "requirements.txt", "data"]:
                if os.path.isfile(item_path):
                    os.remove(item_path)
                else:
                    shutil.rmtree(item_path)

    # 保存并解压
    file_path = os.path.join(WORKSPACE, "algo.zip")
    with open(file_path, "wb") as f:
        f.write(await file.read())

    with zipfile.ZipFile(file_path, "r") as zip_ref:
        zip_ref.extractall(WORKSPACE)

    os.remove(file_path)
    return {"status": "success", "msg": "Algorithm uploaded and extracted"}

@app.get("/resource-usage/")
async def resource_usage():
    """返回计算资源利用情况（CPU、内存）"""
    cpu = psutil.cpu_percent(interval=1)
    mem = psutil.virtual_memory().percent
    return {"cpu": cpu, "memory": mem}

@app.get("/logs/")
async def get_logs(lines: int = 50):
    """获取最近的终端输出（默认返回 50 行）"""
    with log_lock:
        logs = list(log_buffer)[-lines:]
    return {"logs": "".join(logs)}

@app.post("/exec/")
async def exec_command(cmd: str = Form(...)):
    """执行终端命令"""
    global process, log_buffer
    try:
        # 清空旧日志
        with log_lock:
            log_buffer.clear()

        process = subprocess.Popen(
            cmd,
            shell=True,
            cwd=WORKSPACE,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            bufsize=1
        )

        # 启动后台线程，实时收集日志
        threading.Thread(target=stream_reader, args=(process.stdout,), daemon=True).start()

        return {"status": "running", "cmd": cmd}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/interrupt/")
async def interrupt():
    """中断子进程"""
    global process
    if process:
        process.terminate()
        process = None
        return {"status": "terminated"}
    return {"status": "no process"}

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

@app.get("/health/")
async def health():
    """返回节点是否存活"""
    return {"status": "alive"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
