/**
 * 字体加载检测和回退处理
 * 解决打包后字体显示乱码问题
 */

(function() {
    'use strict';
    
    // 检测字体是否可用
    function isFontAvailable(fontName) {
        // 创建一个测试元素
        const testElement = document.createElement('span');
        testElement.style.position = 'absolute';
        testElement.style.visibility = 'hidden';
        testElement.style.top = '-9999px';
        testElement.style.left = '-9999px';
        testElement.style.fontSize = '72px';
        testElement.style.fontFamily = 'monospace';
        testElement.innerHTML = 'mmmmmmmmmmlli';
        
        document.body.appendChild(testElement);
        const originalWidth = testElement.offsetWidth;
        
        testElement.style.fontFamily = fontName + ', monospace';
        const newWidth = testElement.offsetWidth;
        
        document.body.removeChild(testElement);
        
        return originalWidth !== newWidth;
    }
    
    // 应用字体回退策略
    function applyFontFallback() {
        const body = document.body;
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, [class^="heading-"]');
        const brandElements = document.querySelectorAll('.brand span, .rd-navbar-brand span');
        
        // 检测主要字体是否可用
        const montserratAvailable = isFontAvailable('Montserrat');
        const questrialAvailable = isFontAvailable('Questrial');
        
        console.log('字体检测结果:', {
            Montserrat: montserratAvailable,
            Questrial: questrialAvailable
        });
        
        // 如果Google字体不可用，应用本地字体
        if (!montserratAvailable) {
            body.style.fontFamily = '"Microsoft YaHei", "微软雅黑", "PingFang SC", "Hiragino Sans GB", "Heiti SC", "WenQuanYi Micro Hei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
        }
        
        if (!questrialAvailable) {
            headings.forEach(heading => {
                heading.style.fontFamily = '"Microsoft YaHei", "微软雅黑", "PingFang SC", "Hiragino Sans GB", "Heiti SC", "WenQuanYi Micro Hei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
            });
            
            brandElements.forEach(brand => {
                brand.style.fontFamily = '"Microsoft YaHei UI", "Microsoft YaHei", "微软雅黑", "PingFang SC", "Hiragino Sans GB", "Source Han Sans CN", "Noto Sans CJK SC", "WenQuanYi Micro Hei", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
            });
        }
    }
    
    // 检测系统类型并应用对应字体
    function detectSystemAndApplyFonts() {
        const userAgent = navigator.userAgent.toLowerCase();
        let systemFonts = '';
        
        if (userAgent.includes('windows')) {
            systemFonts = '"Microsoft YaHei", "微软雅黑", sans-serif';
        } else if (userAgent.includes('mac')) {
            systemFonts = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
        } else if (userAgent.includes('linux')) {
            systemFonts = '"WenQuanYi Micro Hei", "Microsoft YaHei", sans-serif';
        } else {
            systemFonts = '"Microsoft YaHei", "微软雅黑", sans-serif';
        }
        
        // 添加系统字体样式
        const style = document.createElement('style');
        style.textContent = `
            .system-font-fallback {
                font-family: ${systemFonts} !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('检测到系统:', userAgent.includes('windows') ? 'Windows' : 
                   userAgent.includes('mac') ? 'macOS' : 
                   userAgent.includes('linux') ? 'Linux' : '未知');
    }
    
    // 字体加载超时处理
    function handleFontTimeout() {
        setTimeout(() => {
            const bodyStyle = window.getComputedStyle(document.body);
            const currentFont = bodyStyle.fontFamily;
            
            // 如果字体加载失败，强制应用系统字体
            if (!currentFont || currentFont.includes('serif')) {
                console.warn('字体加载超时，应用系统字体回退');
                document.body.classList.add('system-font-fallback');
                
                const allText = document.querySelectorAll('*');
                allText.forEach(element => {
                    element.classList.add('system-font-fallback');
                });
            }
        }, 3000); // 3秒超时
    }
    
    // 页面加载完成后执行
    function init() {
        detectSystemAndApplyFonts();
        
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                applyFontFallback();
            });
        } else {
            // 兼容不支持 Font Loading API 的浏览器
            setTimeout(applyFontFallback, 1000);
        }
        
        handleFontTimeout();
    }
    
    // DOM 准备就绪时执行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // 为调试提供全局函数
    window.fontDebug = {
        checkFont: isFontAvailable,
        applyFallback: applyFontFallback
    };
    
})();
