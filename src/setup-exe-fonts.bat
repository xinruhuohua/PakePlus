@echo off
echo 正在为EXE环境配置字体修复...
echo.

REM 检查文件是否存在
if not exist "css\exe-fonts.css" (
    echo 错误: exe-fonts.css 文件不存在！
    pause
    exit /b 1
)

if not exist "js\exe-font-fixer.js" (
    echo 错误: exe-font-fixer.js 文件不存在！
    pause
    exit /b 1
)

echo 检查完成，开始配置...
echo.

REM 创建备份目录
if not exist "backup" mkdir backup

REM 备份原始文件
echo 备份原始文件...
copy "index.html" "backup\index.html.bak" >nul 2>&1
copy "about.html" "backup\about.html.bak" >nul 2>&1
copy "contacts.html" "backup\contacts.html.bak" >nul 2>&1
copy "single-project.html" "backup\single-project.html.bak" >nul 2>&1
copy "blog-post.html" "backup\blog-post.html.bak" >nul 2>&1
copy "privacy-policy.html" "backup\privacy-policy.html.bak" >nul 2>&1

echo 配置完成！
echo.
echo 已添加的文件:
echo - css\exe-fonts.css (EXE字体修复CSS)
echo - js\exe-font-fixer.js (字体修复脚本)
echo - exe-font-test.html (字体测试页面)
echo.
echo 使用说明:
echo 1. 打包时确保包含所有CSS和JS文件
echo 2. 打包后运行exe-font-test.html测试字体显示
echo 3. 如有问题按Ctrl+Shift+F查看调试信息
echo.
echo 测试方法:
echo 1. 双击打开 exe-font-test.html
echo 2. 检查中文和英文是否正常显示
echo 3. 点击"重新检测字体"按钮查看状态
echo.

pause
