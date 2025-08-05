// 网页性能监控脚本
(function() {
    'use strict';
    
    // 等待页面完全加载
    window.addEventListener('load', function() {
        // 使用 Performance API 监控页面性能
        if ('performance' in window) {
            const perfData = performance.getEntriesByType('navigation')[0];
            
            if (perfData) {
                const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                const domContentLoaded = perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart;
                const totalTime = perfData.loadEventEnd - perfData.fetchStart;
                
                // 在控制台输出性能信息（开发时使用）
                console.group('🚀 网页性能监控');
                console.log('📊 总加载时间:', Math.round(totalTime), 'ms');
                console.log('📄 DOM内容加载时间:', Math.round(domContentLoaded), 'ms');
                console.log('⚡ 页面加载完成时间:', Math.round(loadTime), 'ms');
                console.groupEnd();
                
                // 可以发送性能数据到分析服务
                // sendPerformanceData(totalTime, domContentLoaded, loadTime);
            }
        }
        
        // 监控资源加载
        if ('performance' in window && 'getEntriesByType' in performance) {
            const resources = performance.getEntriesByType('resource');
            let slowResources = resources.filter(resource => resource.duration > 1000);
            
            if (slowResources.length > 0) {
                console.warn('⚠️ 发现加载缓慢的资源:', slowResources);
            }
        }
    });
    
    // 监控First Contentful Paint (FCP)
    if ('PerformanceObserver' in window) {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                entries.forEach((entry) => {
                    if (entry.name === 'first-contentful-paint') {
                        console.log('🎨 首次内容绘制时间:', Math.round(entry.startTime), 'ms');
                    }
                    if (entry.name === 'largest-contentful-paint') {
                        console.log('🖼️ 最大内容绘制时间:', Math.round(entry.startTime), 'ms');
                    }
                });
            });
            
            observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        } catch (e) {
            // 某些浏览器可能不支持某些性能指标
            console.log('性能监控功能部分不可用');
        }
    }
    
    // 图片懒加载优化检查
    function checkLazyLoading() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        console.log('✨ 启用懒加载的图片数量:', images.length);
    }
    
    // 检查关键资源预加载
    function checkPreloadedResources() {
        const preloadLinks = document.querySelectorAll('link[rel="preload"]');
        console.log('⚡ 预加载资源数量:', preloadLinks.length);
    }
    
    // 页面加载完成后运行检查
    document.addEventListener('DOMContentLoaded', function() {
        checkLazyLoading();
        checkPreloadedResources();
    });
})();
