/**
 * EXE环境字体修复脚本
 * 专门解决打包成exe后字体显示问题
 */

(function() {
  'use strict';

  var FontFixer = {
    // 系统安全字体列表
    safeFonts: [
      'Microsoft YaHei',
      '微软雅黑',
      'PingFang SC',
      'Hiragino Sans GB',
      'SimSun',
      '宋体',
      'SimHei',
      '黑体',
      'Arial',
      'sans-serif'
    ],
    
    // 初始化
    init: function() {
      this.detectEnvironment();
      this.fixFonts();
      this.addFontCSS();
      this.monitorChanges();
    },
    
    // 检测运行环境
    detectEnvironment: function() {
      var isExe = this.isExeEnvironment();
      var isOffline = !navigator.onLine;
      
      document.documentElement.setAttribute('data-env', isExe ? 'exe' : 'web');
      document.documentElement.setAttribute('data-online', isOffline ? 'false' : 'true');
      
      console.log('环境检测:', {
        isExe: isExe,
        isOffline: isOffline,
        userAgent: navigator.userAgent
      });
    },
    
    // 判断是否在exe环境中
    isExeEnvironment: function() {
      // 检测各种exe环境的特征
      var checks = [
        location.protocol === 'file:',
        location.hostname === '',
        navigator.userAgent.indexOf('Electron') > -1,
        navigator.userAgent.indexOf('nwjs') > -1,
        window.process && window.process.type,
        window.require !== undefined,
        !navigator.onLine,
        location.href.indexOf('file://') === 0
      ];
      
      return checks.some(function(check) { return check; });
    },
    
    // 修复所有字体
    fixFonts: function() {
      var self = this;
      var safeFont = this.safeFonts.join(', ');
      
      // 获取所有元素
      var allElements = document.querySelectorAll('*');
      
      for (var i = 0; i < allElements.length; i++) {
        var element = allElements[i];
        
        // 强制设置安全字体
        element.style.fontFamily = safeFont;
        
        // 特殊处理中文元素
        if (this.containsChinese(element.textContent || element.innerText || '')) {
          element.style.fontFamily = '"Microsoft YaHei", "微软雅黑", "SimSun", "宋体", sans-serif';
          element.classList.add('chinese-text');
        }
      }
      
      console.log('字体修复完成，影响元素数量:', allElements.length);
    },
    
    // 检测是否包含中文
    containsChinese: function(text) {
      return /[\u4e00-\u9fff]/.test(text);
    },
    
    // 动态添加CSS
    addFontCSS: function() {
      var css = `
        * {
          font-family: "Microsoft YaHei", "微软雅黑", "SimSun", "宋体", Arial, sans-serif !important;
        }
        
        body {
          font-family: "Microsoft YaHei", "微软雅黑", "SimSun", "宋体", Arial, sans-serif !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }
        
        h1, h2, h3, h4, h5, h6 {
          font-family: "Microsoft YaHei", "微软雅黑", "SimHei", "黑体", Arial, sans-serif !important;
          font-weight: bold !important;
        }
        
        .chinese-text {
          font-family: "Microsoft YaHei", "微软雅黑", "SimSun", "宋体" !important;
        }
      `;
      
      var style = document.createElement('style');
      style.type = 'text/css';
      style.innerHTML = css;
      document.head.appendChild(style);
    },
    
    // 监控DOM变化
    monitorChanges: function() {
      var self = this;
      
      // 使用MutationObserver监控新添加的元素
      if (window.MutationObserver) {
        var observer = new MutationObserver(function(mutations) {
          mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
              mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                  self.fixElementFont(node);
                }
              });
            }
          });
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    },
    
    // 修复单个元素字体
    fixElementFont: function(element) {
      var safeFont = this.safeFonts.join(', ');
      element.style.fontFamily = safeFont;
      
      if (this.containsChinese(element.textContent || element.innerText || '')) {
        element.style.fontFamily = '"Microsoft YaHei", "微软雅黑", "SimSun", "宋体", sans-serif';
        element.classList.add('chinese-text');
      }
      
      // 递归处理子元素
      var children = element.children;
      for (var i = 0; i < children.length; i++) {
        this.fixElementFont(children[i]);
      }
    },
    
    // 测试字体是否可用
    testFont: function(fontFamily) {
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      var testText = '测试文字Test';
      
      // 设置测试字体
      context.font = '20px ' + fontFamily;
      var testWidth = context.measureText(testText).width;
      
      // 设置后备字体
      context.font = '20px serif';
      var fallbackWidth = context.measureText(testText).width;
      
      return testWidth !== fallbackWidth;
    },
    
    // 调试信息
    debug: function() {
      console.log('FontFixer调试信息:');
      console.log('- 安全字体:', this.safeFonts);
      console.log('- 是否EXE环境:', this.isExeEnvironment());
      console.log('- 当前协议:', location.protocol);
      console.log('- 在线状态:', navigator.onLine);
      
      // 测试常用字体
      var testFonts = ['Microsoft YaHei', 'Arial', 'SimSun'];
      testFonts.forEach(function(font) {
        console.log('- 字体可用性 "' + font + '":', this.testFont(font));
      }.bind(this));
    }
  };
  
  // 页面加载完成后立即执行
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      FontFixer.init();
    });
  } else {
    FontFixer.init();
  }
  
  // 也在window.load时执行一次，确保所有内容都已加载
  window.addEventListener('load', function() {
    setTimeout(function() {
      FontFixer.fixFonts();
    }, 100);
  });
  
  // 全局暴露，便于调试
  window.FontFixer = FontFixer;
  
  // 添加调试快捷键 (Ctrl+Shift+F)
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyF') {
      FontFixer.debug();
    }
  });
  
})();
