@echo off
echo 启动本地开发服务器...
echo.
echo 如果您安装了 Python，服务器将在 http://localhost:8000 启动
echo 如果没有安装 Python，请使用 Live Server 扩展或其他本地服务器
echo.

REM 检查是否安装了 Python 3
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo 检测到 Python，启动服务器...
    python -m http.server 8000
    goto :end
)

REM 检查是否安装了 Python 2
python2 --version >nul 2>&1
if %errorlevel% == 0 (
    echo 检测到 Python 2，启动服务器...
    python2 -m SimpleHTTPServer 8000
    goto :end
)

REM 检查是否安装了 Node.js
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo 检测到 Node.js，尝试安装并启动 http-server...
    npm install -g http-server
    http-server -p 8000
    goto :end
)

echo 未检测到 Python 或 Node.js
echo 请安装以下任一软件来启动本地服务器：
echo 1. Python: https://www.python.org/downloads/
echo 2. Node.js: https://nodejs.org/
echo 3. 使用 VS Code Live Server 扩展
echo.
echo 或者您可以将文件上传到 Web 服务器来避免 CORS 问题。

:end
pause
