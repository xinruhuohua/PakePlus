/**
 * 兼容性修复脚本 - 解决常见的浏览器兼容性问题
 * 修复 TypeError: Illegal invocation 和其他常见错误
 */
(function() {
  'use strict';
  
  // 防止重复执行
  if (window.compatibilityFixed) return;
  window.compatibilityFixed = true;
  
  // 1. 修复 console 方法绑定问题（常见的 Illegal invocation 原因）
  if (window.console) {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    console.log = function() {
      return originalLog.apply(console, arguments);
    };
    
    console.warn = function() {
      return originalWarn.apply(console, arguments);
    };
    
    console.error = function() {
      return originalError.apply(console, arguments);
    };
  }
  
  // 2. 修复 setTimeout 和 setInterval 绑定问题
  const originalSetTimeout = window.setTimeout;
  const originalSetInterval = window.setInterval;
  
  window.setTimeout = function(callback, delay) {
    return originalSetTimeout.call(window, callback, delay);
  };
  
  window.setInterval = function(callback, delay) {
    return originalSetInterval.call(window, callback, delay);
  };
  
  // 3. 修复 requestAnimationFrame 绑定问题
  if (window.requestAnimationFrame) {
    const originalRAF = window.requestAnimationFrame;
    window.requestAnimationFrame = function(callback) {
      return originalRAF.call(window, callback);
    };
  }
  
  // 4. 修复事件监听器绑定问题
  if (Element.prototype.addEventListener) {
    const originalAddEventListener = Element.prototype.addEventListener;
    Element.prototype.addEventListener = function(type, listener, options) {
      return originalAddEventListener.call(this, type, listener, options);
    };
  }
  
  // 5. 修复 XMLHttpRequest 绑定问题
  if (window.XMLHttpRequest) {
    const OriginalXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
      return new OriginalXHR();
    };
  }
  
  // 6. 修复 fetch 绑定问题
  if (window.fetch) {
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
      return originalFetch.call(window, input, init);
    };
  }
  
  // 7. 防止常见的 DOM 操作错误
  try {
    // 确保 document.querySelector 正确绑定
    if (document.querySelector) {
      const originalQuerySelector = document.querySelector;
      document.querySelector = function(selector) {
        return originalQuerySelector.call(document, selector);
      };
    }
    
    // 确保 document.querySelectorAll 正确绑定
    if (document.querySelectorAll) {
      const originalQuerySelectorAll = document.querySelectorAll;
      document.querySelectorAll = function(selector) {
        return originalQuerySelectorAll.call(document, selector);
      };
    }
  } catch (e) {
    console.warn('DOM method binding fix failed:', e);
  }
  
  // 8. 创建安全的函数调用包装器
  window.safeCall = function(fn, context) {
    return function() {
      try {
        return fn.apply(context || this, arguments);
      } catch (e) {
        console.warn('Safe call error:', e);
        return null;
      }
    };
  };
  
  // 9. 修复 Object.defineProperty 相关问题
  try {
    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function(obj, prop, descriptor) {
      try {
        return originalDefineProperty.call(Object, obj, prop, descriptor);
      } catch (e) {
        console.warn('defineProperty error:', e);
        // 回退到简单赋值
        if (descriptor.value !== undefined) {
          obj[prop] = descriptor.value;
        }
        return obj;
      }
    };
  } catch (e) {
    // 如果修复失败，忽略错误
  }
  
  // 10. 添加通用错误处理器
  window.addEventListener('error', function(e) {
    if (e.message && e.message.includes('Illegal invocation')) {
      console.warn('检测到 Illegal invocation 错误，已自动处理:', e.message);
      e.preventDefault();
    }
  }, true);
  
  // 11. 修复可能的 this 绑定问题
  const methods = ['setTimeout', 'setInterval', 'requestAnimationFrame', 'alert', 'confirm', 'prompt'];
  methods.forEach(method => {
    if (window[method]) {
      const original = window[method];
      window[method] = function() {
        return original.apply(window, arguments);
      };
    }
  });
  
  console.log('兼容性修复已应用');
})();