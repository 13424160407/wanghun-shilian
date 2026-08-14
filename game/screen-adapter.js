// 屏幕适配模块 - 仅处理移动端竖屏CSS旋转 + 全屏
(function() {
  var screenAdapter = {
    // 检测是否为移动设备
    isMobile: function() {
      return /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
    },

    // 检测设备是否支持自动旋转锁定（deviceorientation API）
    supportsAutoRotation: function() {
      return 'DeviceOrientationEvent' in window;
    },

    // 检测当前是否处于竖屏
    isPortrait: function() {
      return window.innerWidth <= window.innerHeight;
    },

    // 初始化屏幕适配
    init: function() {
      // 仅在移动设备上运行此模块
      if (!this.isMobile()) {
        console.log('非移动设备，屏幕适配模块不启用');
        return;
      }

      console.log('屏幕适配模块已启用 (移动端)');
      this.setupStyles();
      this.attachListeners();
      this.updateLayout();
    },

    // 设置CSS样式
    setupStyles: function() {
      var style = document.createElement('style');
      style.textContent = `
        /* 强制移除所有默认margin/padding */
        * {
          margin: 0;
          padding: 0;
        }

        html, body {
          width: 100%;
          height: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }

        /* 移动端竖屏旋转 - 使用rotate + translate组合 */
        body.portrait-rotated {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vh;
          height: 100vw;
          transform: rotate(90deg) translateY(-100%);
          transform-origin: top left;
          background: #0a0a0f;
        }

        body.portrait-rotated canvas {
          width: 100% !important;
          height: 100% !important;
          display: block;
          touch-action: none;
        }

        body.portrait-rotated #ui,
        body.portrait-rotated .overlay-page,
        body.portrait-rotated #vctrl,
        body.portrait-rotated #fullscreen-btn {
          pointer-events: auto;
        }
      `;
      document.head.appendChild(style);
    },

    // 请求全屏（自动或手动）
    requestFullscreen: function() {
      var elem = document.documentElement;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(function(err) {
            console.log('全屏请求失败:', err.message);
          });
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        }
      }
    },

    // 退出全屏
    exitFullscreen: function() {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      }
    },

    // 附加事件监听器
    attachListeners: function() {
      var self = this;
      window.addEventListener('resize', function() {
        self.updateLayout();
      });
      window.addEventListener('orientationchange', function() {
        setTimeout(function() {
          self.updateLayout();
        }, 200);
      });

      // 第一次用户交互时请求全屏（竖屏模式下）
      var fullscreenRequested = false;
      var requestFsOnInteraction = function() {
        if (!fullscreenRequested && self.isPortrait() && self.isMobile()) {
          self.requestFullscreen();
          fullscreenRequested = true;
          console.log('已请求全屏模式');
        }
      };
      document.addEventListener('touchstart', requestFsOnInteraction, { once: true });
      document.addEventListener('click', requestFsOnInteraction, { once: true });
    },

    // 更新布局
    updateLayout: function() {
      var body = document.body;
      var isPortrait = this.isPortrait();

      console.log('屏幕尺寸:', window.innerWidth, 'x', window.innerHeight, '竖屏:', isPortrait);

      if (isPortrait) {
        // 竖屏：应用CSS旋转
        body.classList.add('portrait-rotated');
        console.log('应用竖屏CSS旋转');
      } else {
        // 横屏：移除CSS旋转
        body.classList.remove('portrait-rotated');
        console.log('移除竖屏CSS旋转 (已为横屏)');
      }
    },

    // 获取转换后的触摸坐标（用于竖屏旋转时的坐标转换）
    transformTouchCoords: function(clientX, clientY, rect, canvasWidth, canvasHeight) {
      var isPortrait = this.isPortrait();

      if (!isPortrait) {
        // 横屏时无需转换
        var ratio = rect.width / canvasWidth;
        return {
          x: (clientX - rect.left - rect.width / 2) / (50 * ratio),
          y: (clientY - rect.top - rect.height / 2) / (50 * ratio)
        };
      }

      // 竖屏旋转时的坐标转换
      // body旋转90度后，屏幕坐标系需要转换
      var screenW = window.innerWidth;
      var screenH = window.innerHeight;
      var ratio = rect.width / canvasWidth;

      // 相对于屏幕中心的坐标
      var relX = clientX - screenW / 2;
      var relY = clientY - screenH / 2;

      // 旋转90度：Y->X（反向）, X->Y
      // 旋转后：新X = -旧Y, 新Y = 旧X
      var rotatedX = -relY / (50 * ratio);
      var rotatedY = relX / (50 * ratio);

      return {
        x: rotatedX,
        y: rotatedY
      };
    }
  };

  // 在全局作用域暴露接口（用于触摸坐标转换）
  window.screenAdapter = screenAdapter;

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      screenAdapter.init();
    });
  } else {
    screenAdapter.init();
  }
})();
