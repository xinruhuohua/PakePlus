/**
 * Service Worker - 缓存优化和离线支持
 * 版本: 1.0.0
 */

const CACHE_NAME = 'heritage-site-v1.0.0';
const OFFLINE_PAGE = 'offline.html';

// 缓存策略配置
const CACHE_STRATEGIES = {
    // 静态资源 - 缓存优先
    STATIC: [
        '/',
        '/index.html',
        '/about.html',
        '/single-project.html',
        '/blog-post.html',
        '/contacts.html',
        '/privacy-policy.html',
        '/search-results.html',
        '/css/bootstrap.css',
        '/css/fonts.css',
        '/css/style.css',
        '/css/local-fonts.css',
        '/css/performance.css',
        '/js/core.min.js',
        '/js/script.js',
        '/js/font-fallback.js',
        '/js/performance-optimizer.js',
        '/images/favicon.ico',
        '/images/logo-default-152x94.png'
    ],
    
    // 图片资源 - 缓存优先，较长时间
    IMAGES: [
        '/images/',
        'https://www.ihchina.cn/Uploads/Picture/',
        'https://bkimg.cdn.bcebos.com/',
        'https://vodpub6.v.news.cn/'
    ],
    
    // 字体资源 - 缓存优先
    FONTS: [
        'https://fonts.googleapis.com/',
        'https://fonts.gstatic.com/',
        '/fonts/'
    ],
    
    // API请求 - 网络优先
    API: [
        '/api/',
        '/bat/'
    ]
};

// 安装事件 - 预缓存关键资源
self.addEventListener('install', event => {
    console.log('🔧 Service Worker 安装中...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('📦 预缓存关键资源');
            return cache.addAll(CACHE_STRATEGIES.STATIC).catch(err => {
                console.error('❌ 预缓存失败:', err);
                // 即使部分资源失败也继续安装
                return Promise.resolve();
            });
        })
    );
    
    // 强制激活新的Service Worker
    self.skipWaiting();
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', event => {
    console.log('✅ Service Worker 激活');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ 删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // 立即控制所有页面
    self.clients.claim();
});

// 获取事件 - 实现缓存策略
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // 只处理GET请求
    if (request.method !== 'GET') return;
    
    // 根据资源类型选择缓存策略
    if (isStaticResource(url)) {
        event.respondWith(cacheFirst(request));
    } else if (isImageResource(url)) {
        event.respondWith(cacheFirst(request, 86400000)); // 24小时
    } else if (isFontResource(url)) {
        event.respondWith(cacheFirst(request, 2592000000)); // 30天
    } else if (isAPIResource(url)) {
        event.respondWith(networkFirst(request));
    } else if (isHTMLPage(url)) {
        event.respondWith(staleWhileRevalidate(request));
    } else {
        event.respondWith(networkFirst(request));
    }
});

// 缓存优先策略
async function cacheFirst(request, maxAge = 3600000) { // 默认1小时
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            // 检查缓存是否过期
            const cacheDate = new Date(cachedResponse.headers.get('date'));
            const now = new Date();
            
            if (now - cacheDate < maxAge) {
                console.log('📋 缓存命中:', request.url);
                return cachedResponse;
            }
        }
        
        // 缓存未命中或已过期，从网络获取
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            cache.put(request, responseClone);
            console.log('🌐 网络获取并缓存:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.error('❌ 缓存优先策略失败:', error);
        
        // 如果是HTML页面且网络失败，返回离线页面
        if (isHTMLPage(new URL(request.url))) {
            const cache = await caches.open(CACHE_NAME);
            return cache.match(OFFLINE_PAGE) || new Response('页面离线不可用', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        }
        
        throw error;
    }
}

// 网络优先策略
async function networkFirst(request, timeout = 3000) {
    try {
        const networkPromise = fetch(request);
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Network timeout')), timeout);
        });
        
        const networkResponse = await Promise.race([networkPromise, timeoutPromise]);
        
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
            console.log('🌐 网络获取:', request.url);
        }
        
        return networkResponse;
    } catch (error) {
        console.log('📋 网络失败，尝试缓存:', request.url);
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

// 边缓存边更新策略
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    // 后台更新缓存
    const fetchPromise = fetch(request).then(networkResponse => {
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
            console.log('🔄 后台更新缓存:', request.url);
        }
        return networkResponse;
    }).catch(error => {
        console.log('🔄 后台更新失败:', error);
    });
    
    // 如果有缓存就立即返回，否则等待网络
    if (cachedResponse) {
        console.log('📋 返回缓存内容:', request.url);
        return cachedResponse;
    }
    
    return fetchPromise;
}

// 资源类型判断函数
function isStaticResource(url) {
    return CACHE_STRATEGIES.STATIC.some(pattern => 
        url.pathname.includes(pattern) || url.pathname === pattern
    );
}

function isImageResource(url) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'];
    return imageExtensions.some(ext => url.pathname.includes(ext)) ||
           CACHE_STRATEGIES.IMAGES.some(pattern => url.href.includes(pattern));
}

function isFontResource(url) {
    const fontExtensions = ['.woff', '.woff2', '.ttf', '.eot', '.otf'];
    return fontExtensions.some(ext => url.pathname.includes(ext)) ||
           CACHE_STRATEGIES.FONTS.some(pattern => url.href.includes(pattern));
}

function isAPIResource(url) {
    return CACHE_STRATEGIES.API.some(pattern => url.pathname.includes(pattern));
}

function isHTMLPage(url) {
    return url.pathname.endsWith('.html') || 
           url.pathname.endsWith('/') ||
           url.pathname === '' ||
           !url.pathname.includes('.');
}

// 消息处理 - 与主线程通信
self.addEventListener('message', event => {
    const { type, payload } = event.data;
    
    switch (type) {
        case 'CACHE_URLS':
            cacheUrls(payload.urls);
            break;
        case 'CLEAR_CACHE':
            clearCache();
            break;
        case 'GET_CACHE_SIZE':
            getCacheSize().then(size => {
                event.ports[0].postMessage({ size });
            });
            break;
    }
});

// 主动缓存URL列表
async function cacheUrls(urls) {
    const cache = await caches.open(CACHE_NAME);
    try {
        await cache.addAll(urls);
        console.log('✅ 批量缓存成功:', urls.length, '个资源');
    } catch (error) {
        console.error('❌ 批量缓存失败:', error);
    }
}

// 清除缓存
async function clearCache() {
    const cacheNames = await caches.keys();
    await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('🗑️ 已清除所有缓存');
}

// 获取缓存大小
async function getCacheSize() {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    let totalSize = 0;
    
    for (const key of keys) {
        const response = await cache.match(key);
        if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
        }
    }
    
    return totalSize;
}

// 后台同步
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('🔄 执行后台同步');
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    try {
        // 在这里执行需要同步的操作
        console.log('✅ 后台同步完成');
    } catch (error) {
        console.error('❌ 后台同步失败:', error);
    }
}

// 推送通知
self.addEventListener('push', event => {
    const options = {
        body: '您有新的内容更新',
        icon: '/images/favicon.ico',
        badge: '/images/favicon.ico',
        data: {
            url: '/'
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('传颂 - 非遗传承', options)
    );
});

// 通知点击
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});

console.log('🚀 Service Worker 已启动');
