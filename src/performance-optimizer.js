/**
 * 高级网页性能优化和链接预加载系统
 * 提升页面加载速度和用户体验
 */

class WebPerformanceOptimizer {
    constructor() {
        this.prefetchedPages = new Set();
        this.intersectionObserver = null;
        this.prefetchDelay = 100;
        this.init();
    }

    init() {
        // 等待DOM准备就绪
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initOptimizations());
        } else {
            this.initOptimizations();
        }
    }

    initOptimizations() {
        this.optimizeImages();
        this.setupLinkPrefetch();
        this.setupIntersectionObserver();
        this.optimizeScripts();
        this.setupServiceWorker();
        this.monitorPerformance();
        this.optimizeFonts();
    }

    // 图片懒加载和优化
    optimizeImages() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        images.forEach(img => {
            // 为图片添加加载状态
            img.addEventListener('load', () => {
                img.classList.add('loaded');
            });

            // 创建占位符
            if (!img.src && img.dataset.src) {
                const placeholder = this.createImagePlaceholder(img);
                img.parentNode.insertBefore(placeholder, img);
                
                // 使用Intersection Observer加载图片
                if (this.intersectionObserver) {
                    this.intersectionObserver.observe(img);
                }
            }
        });

        // 优化背景图片
        this.optimizeBackgroundImages();
    }

    createImagePlaceholder(img) {
        const placeholder = document.createElement('div');
        placeholder.className = 'img-placeholder';
        placeholder.style.width = img.getAttribute('width') + 'px' || '100%';
        placeholder.style.height = img.getAttribute('height') + 'px' || '200px';
        return placeholder;
    }

    optimizeBackgroundImages() {
        const elements = document.querySelectorAll('[data-bg]');
        elements.forEach(el => {
            if (this.intersectionObserver) {
                this.intersectionObserver.observe(el);
            }
        });
    }

    // 链接预加载系统
    setupLinkPrefetch() {
        const links = document.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const href = link.getAttribute('href');
            
            // 只预加载内部链接
            if (this.isInternalLink(href)) {
                // 鼠标悬停预加载
                link.addEventListener('mouseenter', () => {
                    this.prefetchPage(href);
                });

                // 触摸设备的触摸预加载
                link.addEventListener('touchstart', () => {
                    this.prefetchPage(href);
                }, { passive: true });

                // 添加预加载属性
                link.setAttribute('data-prefetch', 'true');
            }
        });

        // 预加载重要页面
        this.prefetchCriticalPages();
    }

    isInternalLink(href) {
        if (!href) return false;
        
        // 排除外部链接、邮件、电话等
        return href.startsWith('./') || 
               href.startsWith('/') || 
               (href.includes('.html') && !href.startsWith('http')) ||
               href.startsWith('#');
    }

    prefetchPage(url) {
        if (this.prefetchedPages.has(url)) return;
        
        // 检查是否为HTML文件
        if (!url.endsWith('.html') && !url.includes('.html')) return;
        
        setTimeout(() => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            link.as = 'document';
            
            link.onload = () => {
                console.log(`✅ 页面预加载成功: ${url}`);
            };
            
            link.onerror = () => {
                console.warn(`❌ 页面预加载失败: ${url}`);
            };
            
            document.head.appendChild(link);
            this.prefetchedPages.add(url);
        }, this.prefetchDelay);
    }

    prefetchCriticalPages() {
        // 预加载首页和主要页面
        const criticalPages = [
            'index.html',
            'about.html',
            'contacts.html',
            'single-project.html'
        ];

        criticalPages.forEach(page => {
            setTimeout(() => this.prefetchPage(page), 1000);
        });
    }

    // 设置Intersection Observer
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const target = entry.target;
                        
                        // 加载懒加载图片
                        if (target.tagName === 'IMG' && target.dataset.src) {
                            target.src = target.dataset.src;
                            target.removeAttribute('data-src');
                        }
                        
                        // 加载背景图片
                        if (target.dataset.bg) {
                            target.style.backgroundImage = `url(${target.dataset.bg})`;
                            target.removeAttribute('data-bg');
                        }
                        
                        this.intersectionObserver.unobserve(target);
                    }
                });
            }, {
                rootMargin: '50px'
            });
        }
    }

    // 优化脚本加载
    optimizeScripts() {
        // 延迟加载非关键脚本
        const deferScripts = document.querySelectorAll('script[data-defer]');
        
        window.addEventListener('load', () => {
            setTimeout(() => {
                deferScripts.forEach(script => {
                    const newScript = document.createElement('script');
                    newScript.src = script.dataset.src || script.src;
                    newScript.async = true;
                    document.head.appendChild(newScript);
                });
            }, 1000);
        });
    }

    // 字体优化
    optimizeFonts() {
        if ('fonts' in document) {
            // 预加载关键字体
            const criticalFonts = [
                'Microsoft YaHei',
                'PingFang SC',
                'Hiragino Sans GB'
            ];

            Promise.all(
                criticalFonts.map(font => document.fonts.load(`1em ${font}`))
            ).then(() => {
                console.log('✅ 关键字体加载完成');
                document.body.classList.add('fonts-loaded');
            }).catch(err => {
                console.warn('⚠️ 字体加载出现问题:', err);
            });
        }
    }

    // Service Worker 设置
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                this.registerServiceWorker();
            });
        }
    }

    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker 注册成功:', registration.scope);
            
            // 显示缓存状态指示器
            this.showCacheIndicator();
        } catch (error) {
            console.log('❌ Service Worker 注册失败:', error);
        }
    }

    showCacheIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'cache-indicator';
        indicator.innerHTML = '🚀';
        indicator.title = '页面已缓存，加载更快';
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 3000);
        }, 1000);
    }

    // 性能监控
    monitorPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    this.reportPerformanceMetrics();
                }, 1000);
            });
        }
    }

    reportPerformanceMetrics() {
        const perfData = performance.getEntriesByType('navigation')[0];
        
        if (perfData) {
            const metrics = {
                loadTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                ttfb: Math.round(perfData.responseStart - perfData.requestStart)
            };

            console.group('📊 性能指标');
            console.log('⚡ 总加载时间:', metrics.totalTime, 'ms');
            console.log('📄 DOM加载时间:', metrics.domContentLoaded, 'ms');
            console.log('🎯 页面完成时间:', metrics.loadTime, 'ms');
            console.log('🔄 首字节时间(TTFB):', metrics.ttfb, 'ms');
            console.groupEnd();

            // 性能警告
            if (metrics.totalTime > 3000) {
                console.warn('⚠️ 页面加载时间过长，建议优化');
            }
            
            if (metrics.ttfb > 500) {
                console.warn('⚠️ 服务器响应时间较慢');
            }
        }
    }

    // 预加载下一页
    prefetchNextPage() {
        const currentPage = window.location.pathname;
        const pageOrder = [
            '/index.html',
            '/about.html',
            '/single-project.html',
            '/blog-post.html',
            '/contacts.html'
        ];
        
        const currentIndex = pageOrder.findIndex(page => currentPage.includes(page.replace('/', '')));
        if (currentIndex >= 0 && currentIndex < pageOrder.length - 1) {
            const nextPage = pageOrder[currentIndex + 1];
            this.prefetchPage(nextPage);
        }
    }

    // 连接状态优化
    handleConnectionChange() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            // 在慢速连接时减少预加载
            if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
                this.prefetchDelay = 1000;
                console.log('🐌 检测到慢速网络，减少预加载');
            } else if (connection.effectiveType === '4g') {
                this.prefetchDelay = 50;
                console.log('🚀 检测到快速网络，增加预加载');
            }
        }
    }
}

// 初始化性能优化器
const performanceOptimizer = new WebPerformanceOptimizer();

// 导出到全局作用域以便调试
window.performanceOptimizer = performanceOptimizer;

// 页面可见性API优化
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时暂停一些操作
        console.log('⏸️ 页面隐藏，暂停部分操作');
    } else {
        // 页面可见时恢复操作
        console.log('▶️ 页面可见，恢复操作');
        performanceOptimizer.prefetchNextPage();
    }
});

// 错误监控
window.addEventListener('error', (event) => {
    console.error('❌ 页面错误:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ 未处理的Promise错误:', event.reason);
});
