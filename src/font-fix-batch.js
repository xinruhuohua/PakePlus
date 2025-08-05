/**
 * 批量修复HTML文件的字体问题
 * 为所有HTML文件添加字体回退支持
 */

// 需要修复的HTML文件列表
const htmlFiles = [
    'about.html',
    'blog-post.html', 
    'contacts.html',
    'privacy-policy.html',
    'search-results.html',
    'single-project.html'
];

// 字体修复的HTML片段
const fontFixHTML = `
    <!-- 本地字体回退方案 - 解决打包后字体乱码问题 -->
    <link rel="stylesheet" href="css/local-fonts.css">
    
    <!-- 字体回退检测脚本 -->
    <script>
    // 简化版字体检测
    (function() {
        function applyFontFallback() {
            var style = document.createElement('style');
            style.textContent = 
                'body { font-family: "Montserrat", "Microsoft YaHei", "微软雅黑", "PingFang SC", "Hiragino Sans GB", sans-serif !important; }' +
                'h1, h2, h3, h4, h5, h6, [class^="heading-"] { font-family: "Questrial", "Microsoft YaHei", "微软雅黑", "PingFang SC", "Hiragino Sans GB", sans-serif !important; }' +
                '.brand span, .rd-navbar-brand span { font-family: "Microsoft YaHei UI", "Microsoft YaHei", "微软雅黑", sans-serif !important; }';
            document.head.appendChild(style);
        }
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyFontFallback);
        } else {
            applyFontFallback();
        }
    })();
    </script>`;

console.log('字体修复代码已准备，需要手动添加到以下文件中：');
console.log(htmlFiles);
console.log('\n添加位置：在每个HTML文件的</head>标签之前');
console.log('\n修复代码：');
console.log(fontFixHTML);
