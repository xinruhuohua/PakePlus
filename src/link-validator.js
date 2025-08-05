/**
 * 链接检测和修复工具
 * 自动检测和修复网页间的链接问题
 */

class LinkValidator {
    constructor() {
        this.validatedLinks = new Set();
        this.brokenLinks = new Set();
        this.pendingChecks = new Map();
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.validateAllLinks());
        } else {
            this.validateAllLinks();
        }
    }

    // 验证所有页面链接
    async validateAllLinks() {
        const links = document.querySelectorAll('a[href]');
        console.log(`🔍 开始检测 ${links.length} 个链接`);

        const results = {
            total: links.length,
            valid: 0,
            broken: 0,
            external: 0,
            fixed: 0
        };

        for (const link of links) {
            const href = link.getAttribute('href');
            
            if (this.isExternalLink(href)) {
                results.external++;
                this.markAsExternal(link);
                continue;
            }

            if (this.isAnchorLink(href)) {
                this.validateAnchorLink(link, href);
                continue;
            }

            const isValid = await this.validateInternalLink(href);
            
            if (isValid) {
                results.valid++;
                this.markAsValid(link);
            } else {
                results.broken++;
                const fixed = this.attemptLinkFix(link, href);
                if (fixed) {
                    results.fixed++;
                    results.broken--;
                    results.valid++;
                }
            }
        }

        this.reportResults(results);
        this.enhanceValidLinks();
    }

    // 检测是否为外部链接
    isExternalLink(href) {
        return href && (
            href.startsWith('http://') ||
            href.startsWith('https://') ||
            href.startsWith('mailto:') ||
            href.startsWith('tel:')
        );
    }

    // 检测是否为锚点链接
    isAnchorLink(href) {
        return href && href.startsWith('#');
    }

    // 验证内部链接
    async validateInternalLink(href) {
        if (this.validatedLinks.has(href)) {
            return true;
        }

        if (this.brokenLinks.has(href)) {
            return false;
        }

        if (this.pendingChecks.has(href)) {
            return this.pendingChecks.get(href);
        }

        const checkPromise = this.checkLinkExists(href);
        this.pendingChecks.set(href, checkPromise);

        try {
            const exists = await checkPromise;
            this.pendingChecks.delete(href);
            
            if (exists) {
                this.validatedLinks.add(href);
                return true;
            } else {
                this.brokenLinks.add(href);
                return false;
            }
        } catch (error) {
            this.pendingChecks.delete(href);
            console.warn(`链接检测失败: ${href}`, error);
            return false;
        }
    }

    // 检查链接是否存在
    async checkLinkExists(href) {
        try {
            const response = await fetch(href, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            return response.ok || response.type === 'opaque';
        } catch (error) {
            // 如果 HEAD 请求失败，尝试 GET 请求
            try {
                const response = await fetch(href, {
                    method: 'GET',
                    mode: 'no-cors',
                    cache: 'no-cache'
                });
                return response.ok || response.type === 'opaque';
            } catch (getError) {
                return false;
            }
        }
    }

    // 验证锚点链接
    validateAnchorLink(link, href) {
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            this.markAsValid(link);
        } else {
            this.markAsBroken(link, `锚点 #${targetId} 不存在`);
            
            // 尝试找到相似的锚点
            const similarAnchor = this.findSimilarAnchor(targetId);
            if (similarAnchor) {
                this.suggestFix(link, `#${similarAnchor}`, `建议修改为 #${similarAnchor}`);
            }
        }
    }

    // 查找相似的锚点
    findSimilarAnchor(targetId) {
        const allIds = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
        const lowercaseTarget = targetId.toLowerCase();
        
        // 查找完全匹配（忽略大小写）
        const exactMatch = allIds.find(id => id.toLowerCase() === lowercaseTarget);
        if (exactMatch && exactMatch !== targetId) {
            return exactMatch;
        }
        
        // 查找包含关系
        const containsMatch = allIds.find(id => 
            id.toLowerCase().includes(lowercaseTarget) || 
            lowercaseTarget.includes(id.toLowerCase())
        );
        
        return containsMatch;
    }

    // 尝试修复链接
    attemptLinkFix(link, href) {
        // 常见的修复策略
        const fixStrategies = [
            // 添加 .html 扩展名
            () => {
                if (!href.includes('.') && !href.includes('#') && !href.includes('?')) {
                    return href + '.html';
                }
                return null;
            },
            
            // 移除多余的斜杠
            () => {
                if (href.includes('//') && !href.startsWith('http')) {
                    return href.replace(/\/+/g, '/');
                }
                return null;
            },
            
            // 修正大小写
            () => {
                const commonPages = ['index.html', 'about.html', 'contact.html', 'contacts.html'];
                const lowerHref = href.toLowerCase();
                const match = commonPages.find(page => page === lowerHref);
                return match !== href ? match : null;
            },
            
            // 修正常见拼写错误
            () => {
                const corrections = {
                    'contac.html': 'contacts.html',
                    'contact.html': 'contacts.html',
                    'aboutus.html': 'about.html',
                    'home.html': 'index.html'
                };
                return corrections[href] || null;
            }
        ];

        for (const strategy of fixStrategies) {
            const fixedHref = strategy();
            if (fixedHref && fixedHref !== href) {
                if (this.validatedLinks.has(fixedHref) || this.testLinkSync(fixedHref)) {
                    link.setAttribute('href', fixedHref);
                    link.setAttribute('data-original-href', href);
                    link.setAttribute('data-auto-fixed', 'true');
                    console.log(`✅ 自动修复链接: ${href} → ${fixedHref}`);
                    this.markAsFixed(link);
                    return true;
                }
            }
        }

        this.markAsBroken(link, `无法访问: ${href}`);
        return false;
    }

    // 同步测试链接（仅用于简单检查）
    testLinkSync(href) {
        // 检查是否为相对路径且文件可能存在
        if (!href.startsWith('http') && !href.startsWith('//')) {
            // 简单的启发式检查
            return href.includes('.html') || href === '/' || href === './';
        }
        return false;
    }

    // 标记链接状态
    markAsValid(link) {
        link.classList.add('link-valid');
        link.classList.remove('link-broken', 'link-fixed');
    }

    markAsBroken(link, reason) {
        link.classList.add('link-broken');
        link.classList.remove('link-valid', 'link-fixed');
        link.setAttribute('title', reason);
        link.setAttribute('data-link-error', reason);
    }

    markAsFixed(link) {
        link.classList.add('link-fixed');
        link.classList.remove('link-broken');
    }

    markAsExternal(link) {
        link.classList.add('link-external');
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        
        // 添加外部链接图标
        if (!link.querySelector('.external-icon')) {
            const icon = document.createElement('span');
            icon.className = 'external-icon';
            icon.innerHTML = ' ↗';
            icon.style.fontSize = '0.8em';
            icon.style.opacity = '0.7';
            link.appendChild(icon);
        }
    }

    // 建议修复
    suggestFix(link, suggestedHref, message) {
        link.setAttribute('data-suggested-fix', suggestedHref);
        link.setAttribute('data-fix-message', message);
        link.classList.add('link-suggested-fix');
        
        // 添加点击事件来应用建议的修复
        link.addEventListener('click', (event) => {
            if (event.ctrlKey || event.metaKey) {
                event.preventDefault();
                const apply = confirm(`${message}\n\n点击确定应用修复`);
                if (apply) {
                    link.setAttribute('href', suggestedHref);
                    link.removeAttribute('data-suggested-fix');
                    link.removeAttribute('data-fix-message');
                    link.classList.remove('link-suggested-fix');
                    this.markAsFixed(link);
                }
            }
        });
    }

    // 增强有效链接
    enhanceValidLinks() {
        const validLinks = document.querySelectorAll('a.link-valid');
        
        validLinks.forEach(link => {
            const href = link.getAttribute('href');
            
            // 添加预加载
            if (this.isInternalHTMLLink(href)) {
                link.addEventListener('mouseenter', () => {
                    this.preloadPage(href);
                }, { once: true });
            }
            
            // 添加平滑滚动到锚点
            if (this.isAnchorLink(href)) {
                link.addEventListener('click', (event) => {
                    const targetId = href.substring(1);
                    const targetElement = document.getElementById(targetId);
                    
                    if (targetElement) {
                        event.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                        
                        // 更新URL
                        history.pushState(null, null, href);
                    }
                });
            }
        });
    }

    // 检查是否为内部HTML链接
    isInternalHTMLLink(href) {
        return href && 
               !this.isExternalLink(href) && 
               !this.isAnchorLink(href) && 
               (href.includes('.html') || href === '/' || href === './');
    }

    // 预加载页面
    preloadPage(href) {
        if (document.querySelector(`link[rel="prefetch"][href="${href}"]`)) {
            return; // 已经预加载
        }

        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        link.as = 'document';
        document.head.appendChild(link);
        
        console.log(`🚀 预加载页面: ${href}`);
    }

    // 报告结果
    reportResults(results) {
        console.group('🔗 链接检测报告');
        console.log(`📊 总链接数: ${results.total}`);
        console.log(`✅ 有效链接: ${results.valid}`);
        console.log(`❌ 损坏链接: ${results.broken}`);
        console.log(`🌐 外部链接: ${results.external}`);
        console.log(`🔧 自动修复: ${results.fixed}`);
        console.groupEnd();

        // 在页面上显示报告
        this.displayReport(results);
    }

    // 在页面上显示报告
    displayReport(results) {
        // 只在开发环境显示
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const reportDiv = document.createElement('div');
            reportDiv.id = 'link-report';
            reportDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: #333;
                color: white;
                padding: 15px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 12px;
                z-index: 10000;
                max-width: 300px;
                opacity: 0.9;
                transition: opacity 0.3s;
            `;
            
            reportDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 10px;">🔗 链接检测报告</div>
                <div>📊 总数: ${results.total}</div>
                <div>✅ 有效: ${results.valid}</div>
                <div>❌ 损坏: ${results.broken}</div>
                <div>🌐 外部: ${results.external}</div>
                <div>🔧 修复: ${results.fixed}</div>
                <button onclick="this.parentElement.remove()" style="margin-top: 10px; background: #555; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">关闭</button>
            `;
            
            document.body.appendChild(reportDiv);
            
            // 5秒后自动淡出
            setTimeout(() => {
                reportDiv.style.opacity = '0.3';
            }, 5000);
        }
    }
}

// 添加链接状态的CSS样式
const linkStyles = document.createElement('style');
linkStyles.textContent = `
    .link-broken {
        color: #dc3545 !important;
        text-decoration: line-through !important;
        position: relative;
    }
    
    .link-broken::after {
        content: " ⚠";
        color: #dc3545;
        font-size: 0.8em;
    }
    
    .link-fixed {
        color: #28a745 !important;
        position: relative;
    }
    
    .link-fixed::after {
        content: " ✓";
        color: #28a745;
        font-size: 0.8em;
    }
    
    .link-suggested-fix {
        color: #ffc107 !important;
        position: relative;
    }
    
    .link-suggested-fix::after {
        content: " 💡";
        font-size: 0.8em;
    }
    
    .link-external {
        color: #007bff !important;
    }
    
    .link-valid {
        position: relative;
    }
`;

document.head.appendChild(linkStyles);

// 初始化链接验证器
const linkValidator = new LinkValidator();

// 导出到全局作用域以便调试
window.linkValidator = linkValidator;
