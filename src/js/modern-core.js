/**
 * 现代化的核心JavaScript库
 * 替代旧版本jQuery，解决已弃用功能问题
 * 版本: 1.0.0
 */

(function(window, document) {
    'use strict';

    // 创建主要的工具函数库
    var ModernCore = function(selector, context) {
        return new ModernCore.fn.init(selector, context);
    };

    // 原型方法
    ModernCore.fn = ModernCore.prototype = {
        constructor: ModernCore,
        length: 0,

        // 初始化方法
        init: function(selector, context) {
            if (!selector) return this;

            context = context || document;

            if (typeof selector === 'string') {
                var elements = context.querySelectorAll(selector);
                this.length = elements.length;
                for (var i = 0; i < elements.length; i++) {
                    this[i] = elements[i];
                }
            } else if (selector.nodeType) {
                this[0] = selector;
                this.length = 1;
            } else if (selector === window) {
                this[0] = window;
                this.length = 1;
            }

            return this;
        },

        // 遍历方法
        each: function(callback) {
            for (var i = 0; i < this.length; i++) {
                if (callback.call(this[i], i, this[i]) === false) {
                    break;
                }
            }
            return this;
        },

        // 现代化的事件绑定
        on: function(events, selector, handler) {
            if (typeof selector === 'function') {
                handler = selector;
                selector = null;
            }

            var eventTypes = events.split(' ');

            return this.each(function() {
                var element = this;
                
                eventTypes.forEach(function(eventType) {
                    if (selector) {
                        // 事件委托
                        element.addEventListener(eventType, function(e) {
                            var target = e.target.closest(selector);
                            if (target && element.contains(target)) {
                                handler.call(target, e);
                            }
                        }, { passive: true });
                    } else {
                        // 直接绑定
                        element.addEventListener(eventType, handler, { passive: true });
                    }
                });
            });
        },

        // 现代化的事件解绑
        off: function(events, handler) {
            var eventTypes = events.split(' ');

            return this.each(function() {
                var element = this;
                eventTypes.forEach(function(eventType) {
                    if (handler) {
                        element.removeEventListener(eventType, handler);
                    } else {
                        // 移除所有该类型的事件监听器
                        var newElement = element.cloneNode(true);
                        element.parentNode.replaceChild(newElement, element);
                    }
                });
            });
        },

        // CSS 操作
        css: function(property, value) {
            if (typeof property === 'object') {
                return this.each(function() {
                    Object.keys(property).forEach(function(key) {
                        this.style[key] = property[key];
                    }.bind(this));
                });
            }

            if (value !== undefined) {
                return this.each(function() {
                    this.style[property] = value;
                });
            }

            if (this.length > 0) {
                return window.getComputedStyle(this[0])[property];
            }
        },

        // 类操作
        addClass: function(className) {
            return this.each(function() {
                this.classList.add(className);
            });
        },

        removeClass: function(className) {
            return this.each(function() {
                this.classList.remove(className);
            });
        },

        toggleClass: function(className) {
            return this.each(function() {
                this.classList.toggle(className);
            });
        },

        hasClass: function(className) {
            return this.length > 0 && this[0].classList.contains(className);
        },

        // 属性操作
        attr: function(name, value) {
            if (value !== undefined) {
                return this.each(function() {
                    this.setAttribute(name, value);
                });
            }
            return this.length > 0 ? this[0].getAttribute(name) : null;
        },

        // HTML内容操作
        html: function(content) {
            if (content !== undefined) {
                return this.each(function() {
                    this.innerHTML = content;
                });
            }
            return this.length > 0 ? this[0].innerHTML : '';
        },

        // 文本内容操作
        text: function(content) {
            if (content !== undefined) {
                return this.each(function() {
                    this.textContent = content;
                });
            }
            return this.length > 0 ? this[0].textContent : '';
        },

        // 显示/隐藏
        show: function() {
            return this.each(function() {
                this.style.display = '';
            });
        },

        hide: function() {
            return this.each(function() {
                this.style.display = 'none';
            });
        },

        // 动画效果 - 使用现代 Web Animation API
        fadeIn: function(duration) {
            duration = duration || 300;
            
            return this.each(function() {
                var element = this;
                element.style.opacity = '0';
                element.style.display = '';
                
                element.animate([
                    { opacity: 0 },
                    { opacity: 1 }
                ], {
                    duration: duration,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                });
            });
        },

        fadeOut: function(duration) {
            duration = duration || 300;
            
            return this.each(function() {
                var element = this;
                
                var animation = element.animate([
                    { opacity: 1 },
                    { opacity: 0 }
                ], {
                    duration: duration,
                    easing: 'ease-in-out',
                    fill: 'forwards'
                });
                
                animation.addEventListener('finish', function() {
                    element.style.display = 'none';
                });
            });
        }
    };

    // 设置原型
    ModernCore.fn.init.prototype = ModernCore.fn;

    // 静态方法
    ModernCore.extend = function(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key)) {
                target[key] = source[key];
            }
        }
        return target;
    };

    // AJAX 方法 - 使用现代 Fetch API
    ModernCore.ajax = function(options) {
        var defaults = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 10000
        };

        options = ModernCore.extend(defaults, options);

        // 创建 AbortController 用于超时处理
        var controller = new AbortController();
        var timeoutId = setTimeout(function() {
            controller.abort();
        }, options.timeout);

        var fetchOptions = {
            method: options.method,
            headers: options.headers,
            signal: controller.signal
        };

        if (options.data && options.method !== 'GET') {
            fetchOptions.body = typeof options.data === 'string' ? 
                options.data : JSON.stringify(options.data);
        }

        return fetch(options.url, fetchOptions)
            .then(function(response) {
                clearTimeout(timeoutId);
                if (!response.ok) {
                    throw new Error('HTTP ' + response.status + ': ' + response.statusText);
                }
                return options.dataType === 'json' ? response.json() : response.text();
            })
            .then(function(data) {
                if (options.success) {
                    options.success(data);
                }
                return data;
            })
            .catch(function(error) {
                clearTimeout(timeoutId);
                if (options.error) {
                    options.error(error);
                }
                throw error;
            });
    };

    // DOM 准备完成事件 - 现代化替代 $(document).ready()
    ModernCore.ready = function(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback, { once: true });
        } else {
            callback();
        }
    };

    // 现代化的动画帧处理
    ModernCore.requestFrame = function(callback) {
        if (window.requestAnimationFrame) {
            return window.requestAnimationFrame(callback);
        } else {
            return setTimeout(callback, 16); // 约60fps
        }
    };

    ModernCore.cancelFrame = function(id) {
        if (window.cancelAnimationFrame) {
            window.cancelAnimationFrame(id);
        } else {
            clearTimeout(id);
        }
    };

    // 现代化的空闲时间处理
    ModernCore.requestIdle = function(callback, timeout) {
        if (window.requestIdleCallback) {
            return window.requestIdleCallback(callback, { timeout: timeout || 5000 });
        } else {
            return setTimeout(callback, 1);
        }
    };

    ModernCore.cancelIdle = function(id) {
        if (window.cancelIdleCallback) {
            window.cancelIdleCallback(id);
        } else {
            clearTimeout(id);
        }
    };

    // 工具方法
    ModernCore.utils = {
        // 防抖函数
        debounce: function(func, wait) {
            var timeout;
            return function() {
                var context = this;
                var args = arguments;
                clearTimeout(timeout);
                timeout = setTimeout(function() {
                    func.apply(context, args);
                }, wait);
            };
        },

        // 节流函数
        throttle: function(func, limit) {
            var inThrottle;
            return function() {
                var args = arguments;
                var context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(function() {
                        inThrottle = false;
                    }, limit);
                }
            };
        },

        // 深度克隆
        deepClone: function(obj) {
            if (obj === null || typeof obj !== 'object') return obj;
            if (obj instanceof Date) return new Date(obj.getTime());
            if (obj instanceof Array) return obj.map(ModernCore.utils.deepClone);
            if (typeof obj === 'object') {
                var cloned = {};
                Object.keys(obj).forEach(function(key) {
                    cloned[key] = ModernCore.utils.deepClone(obj[key]);
                });
                return cloned;
            }
        }
    };

    // 性能监控
    ModernCore.performance = {
        mark: function(name) {
            if (window.performance && window.performance.mark) {
                window.performance.mark(name);
            }
        },

        measure: function(name, startMark, endMark) {
            if (window.performance && window.performance.measure) {
                window.performance.measure(name, startMark, endMark);
                var entries = window.performance.getEntriesByName(name);
                return entries.length > 0 ? entries[entries.length - 1].duration : 0;
            }
            return 0;
        },

        getEntries: function() {
            if (window.performance && window.performance.getEntries) {
                return window.performance.getEntries();
            }
            return [];
        }
    };

    // 暴露到全局
    window.$ = window.ModernCore = ModernCore;

    // 兼容性检查和警告
    if (console && console.info) {
        console.info('ModernCore 库已加载 - 现代化的 DOM 操作库，替代旧版本 jQuery');
        
        // 检查浏览器兼容性
        var unsupportedFeatures = [];
        if (!window.fetch) unsupportedFeatures.push('Fetch API');
        if (!window.requestAnimationFrame) unsupportedFeatures.push('requestAnimationFrame');
        if (!Element.prototype.classList) unsupportedFeatures.push('classList');
        
        if (unsupportedFeatures.length > 0) {
            console.warn('浏览器不支持以下现代特性，某些功能可能受限:', unsupportedFeatures);
        }
    }

})(window, document);
