/**
 * 字体加载优化脚本
 * 用于优化字体加载性能，减少FOIT (Flash of Invisible Text) 问题
 */

(function() {
  'use strict';

  // 字体加载状态管理
  var FontLoader = {
    // 关键字体列表
    criticalFonts: [
      'Montserrat-Optimized',
      'Questrial-Optimized'
    ],
    
    // 字体加载状态
    loadedFonts: [],
    
    // 初始化
    init: function() {
      this.detectFontSupport();
      this.loadFonts();
      this.addFallbackTimeout();
    },
    
    // 检测浏览器字体支持
    detectFontSupport: function() {
      // 检测是否支持 font-display: swap
      if (CSS && CSS.supports && CSS.supports('font-display', 'swap')) {
        document.documentElement.classList.add('font-display-swap');
      }
      
      // 检测是否支持 Font Loading API
      if (document.fonts && document.fonts.ready) {
        document.documentElement.classList.add('font-loading-api');
      }
    },
    
    // 字体加载主逻辑
    loadFonts: function() {
      var self = this;
      
      if (document.fonts && document.fonts.ready) {
        // 使用现代 Font Loading API
        document.fonts.ready.then(function() {
          self.onFontsLoaded();
        });
        
        // 监听单个字体加载
        document.fonts.addEventListener('loadingdone', function(event) {
          event.fontfaces.forEach(function(fontface) {
            if (self.criticalFonts.indexOf(fontface.family) !== -1) {
              self.loadedFonts.push(fontface.family);
            }
          });
          self.checkAllFontsLoaded();
        });
        
      } else {
        // 兼容旧浏览器的方案
        this.fallbackFontDetection();
      }
    },
    
    // 兼容方案：字体检测
    fallbackFontDetection: function() {
      var self = this;
      var testString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      var testSize = '72px';
      var fallbackFont = 'serif';
      
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      
      // 测试每个关键字体
      this.criticalFonts.forEach(function(fontFamily) {
        setTimeout(function() {
          self.testFontLoaded(fontFamily, testString, testSize, fallbackFont, context);
        }, 100);
      });
    },
    
    // 测试字体是否已加载
    testFontLoaded: function(fontFamily, testString, testSize, fallbackFont, context) {
      var self = this;
      
      // 获取后备字体的宽度
      context.font = testSize + ' ' + fallbackFont;
      var fallbackWidth = context.measureText(testString).width;
      
      // 获取目标字体的宽度
      context.font = testSize + ' ' + fontFamily + ', ' + fallbackFont;
      var targetWidth = context.measureText(testString).width;
      
      // 如果宽度不同，说明字体已加载
      if (targetWidth !== fallbackWidth) {
        this.loadedFonts.push(fontFamily);
        this.checkAllFontsLoaded();
      } else {
        // 重试检测
        var retryCount = 0;
        var maxRetries = 10;
        var retryInterval = setInterval(function() {
          context.font = testSize + ' ' + fontFamily + ', ' + fallbackFont;
          var currentWidth = context.measureText(testString).width;
          
          if (currentWidth !== fallbackWidth || retryCount >= maxRetries) {
            clearInterval(retryInterval);
            if (currentWidth !== fallbackWidth) {
              self.loadedFonts.push(fontFamily);
              self.checkAllFontsLoaded();
            }
          }
          retryCount++;
        }, 100);
      }
    },
    
    // 检查所有字体是否加载完成
    checkAllFontsLoaded: function() {
      if (this.loadedFonts.length >= this.criticalFonts.length) {
        this.onFontsLoaded();
      }
    },
    
    // 字体加载完成回调
    onFontsLoaded: function() {
      document.documentElement.classList.add('fonts-loaded');
      
      // 触发自定义事件
      var event;
      try {
        event = new CustomEvent('fontsLoaded', { 
          detail: { loadedFonts: this.loadedFonts } 
        });
      } catch (e) {
        // IE 兼容性
        event = document.createEvent('CustomEvent');
        event.initCustomEvent('fontsLoaded', false, false, { 
          loadedFonts: this.loadedFonts 
        });
      }
      document.dispatchEvent(event);
      
      // 移除加载样式
      var loadingElements = document.querySelectorAll('.font-loading');
      for (var i = 0; i < loadingElements.length; i++) {
        loadingElements[i].classList.remove('font-loading');
      }
    },
    
    // 后备超时机制
    addFallbackTimeout: function() {
      var self = this;
      setTimeout(function() {
        if (!document.documentElement.classList.contains('fonts-loaded')) {
          console.warn('字体加载超时，使用后备方案');
          self.onFontsLoaded();
        }
      }, 3000); // 3秒超时
    }
  };
  
  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      FontLoader.init();
    });
  } else {
    FontLoader.init();
  }
  
  // 全局暴露 FontLoader 便于调试
  window.FontLoader = FontLoader;
  
})();
