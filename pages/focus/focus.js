// pages/focus/focus.js
const cityUtils = require('../../utils/cities.js');

Page({
  data: {
    fromCity: '',
    toCity: '',
    flightNumber: '',
    distance: 0,
    totalDuration: 0, // 总时长（分钟）
    remainingTime: 0, // 剩余时间（秒）
    displayTime: '00:00',
    focusedTime: '00:00',
    progressPercent: 0,
    statusText: '准备起飞',
    altitude: 0,
    isPaused: false,
    isCompleted: false,
    showCelebration: false,
    timer: null,
    startTime: null
  },

  onLoad(options) {
    const { fromCity, toCity, duration, flightNumber, distance } = options;
    
    this.setData({
      fromCity,
      toCity,
      flightNumber,
      distance: parseInt(distance),
      totalDuration: parseInt(duration),
      remainingTime: parseInt(duration) * 60, // 转换为秒
      statusText: '航班起飞中...'
    });

    this.updateDisplay();
    this.startFocus();
    
    // 启用返回拦截
    this.enableBackInterception();
  },

  onUnload() {
    this.clearTimer();
    this.disableBackInterception();
  },

  onShow() {
    // 页面显示时重新启用返回拦截（如果专注未完成）
    if (!this.data.isCompleted && this.data.remainingTime > 0) {
      this.enableBackInterception();
    }
  },

  onHide() {
    // 页面隐藏时禁用返回拦截
    this.disableBackInterception();
  },


  // 开始专注
  startFocus() {
    this.setData({
      startTime: Date.now(),
      statusText: '专注飞行中...'
    });
    this.startTimer();
  },

  // 开始计时器
  startTimer() {
    this.data.timer = setInterval(() => {
      if (!this.data.isPaused && this.data.remainingTime > 0) {
        const newRemainingTime = this.data.remainingTime - 1;
        this.setData({
          remainingTime: newRemainingTime
        });
        
        this.updateDisplay();
        this.updateAltitude();
        
        if (newRemainingTime <= 0) {
          this.completeFocus();
        }
      }
    }, 1000);
  },

  // 清除计时器
  clearTimer() {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  // 更新显示
  updateDisplay() {
    const { remainingTime, totalDuration } = this.data;
    const totalSeconds = totalDuration * 60;
    const focusedSeconds = totalSeconds - remainingTime;
    
    this.setData({
      displayTime: this.formatTime(remainingTime),
      focusedTime: this.formatTime(focusedSeconds),
      progressPercent: Math.round((focusedSeconds / totalSeconds) * 100)
    });
  },


  // 更新飞行高度
  updateAltitude() {
    const { remainingTime, totalDuration } = this.data;
    const totalSeconds = totalDuration * 60;
    const progress = (totalSeconds - remainingTime) / totalSeconds;
    
    // 模拟飞行高度变化
    let altitude;
    if (progress < 0.2) {
      // 起飞阶段
      altitude = Math.round(progress * 5 * 10000); // 0-10000米
    } else if (progress < 0.8) {
      // 巡航阶段
      altitude = 10000 + Math.round(Math.sin(progress * 10) * 1000); // 9000-11000米波动
    } else {
      // 降落阶段
      altitude = Math.round(10000 * (1 - (progress - 0.8) * 5)); // 10000-0米
    }
    
    this.setData({ altitude });
  },

  // 格式化时间显示
  formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  },

  // 切换暂停状态
  togglePause() {
    const newPausedState = !this.data.isPaused;
    this.setData({
      isPaused: newPausedState,
      statusText: newPausedState ? '航班暂停中...' : '专注飞行中...'
    });

    if (newPausedState) {
      wx.showToast({
        title: '航班已暂停',
        icon: 'none'
      });
    } else {
      wx.showToast({
        title: '继续飞行',
        icon: 'none'
      });
    }
  },

  // 停止专注
  stopFocus() {
    wx.showModal({
      title: '确认取消',
      content: '确定要取消当前航班吗？专注进度将不会保存。',
      confirmText: '确定取消',
      cancelText: '继续专注',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          this.clearTimer();
          this.disableBackInterception();
          wx.navigateBack();
        }
      }
    });
  },

  // 完成专注
  completeFocus() {
    this.clearTimer();
    
    // 禁用返回拦截，因为专注已完成
    this.disableBackInterception();
    
    const { fromCity, toCity, totalDuration, flightNumber, distance } = this.data;
    
    // 保存专注记录
    const record = {
      id: Date.now(),
      fromCity,
      toCity,
      duration: parseInt(totalDuration) || 0, // 确保duration是整数分钟
      flightNumber,
      distance: parseInt(distance) || 0,
      startTime: this.data.startTime,
      endTime: Date.now(),
      completed: true
    };
    
    console.log('准备保存专注记录:', {
      totalDuration: totalDuration,
      duration: record.duration,
      fromCity: fromCity,
      toCity: toCity
    });
    
    const app = getApp();
    app.saveFocusRecord(record);
    
    this.setData({
      isCompleted: true,
      statusText: '航班已到达！',
      showCelebration: true,
      remainingTime: 0,
      progressPercent: 100
    });

    // 3秒后自动关闭庆祝弹窗
    setTimeout(() => {
      this.setData({
        showCelebration: false
      });
    }, 3000);
  },

  // 返回首页
  backToHome() {
    wx.switchTab({
      url: '/pages/index/index'
    });
  },

  // 启用返回拦截
  enableBackInterception() {
    wx.enableAlertBeforeUnload({
      message: '专注飞行进行中，确定要离开吗？',
      success: () => {
        console.log('返回拦截已启用');
      },
      fail: () => {
        // 如果不支持enableAlertBeforeUnload，使用onBackPress
        console.log('使用备用返回拦截方案');
      }
    });
  },

  // 禁用返回拦截
  disableBackInterception() {
    wx.disableAlertBeforeUnload({
      success: () => {
        console.log('返回拦截已禁用');
      }
    });
  },

  // 处理返回按钮点击（备用方案）
  onBackPress() {
    if (!this.data.isCompleted && this.data.remainingTime > 0) {
      wx.showModal({
        title: '确认离开',
        content: '专注飞行进行中，离开后进度将不会保存。确定要离开吗？',
        confirmText: '确定离开',
        cancelText: '继续专注',
        confirmColor: '#ff4d4f',
        success: (res) => {
          if (res.confirm) {
            this.clearTimer();
            this.disableBackInterception();
            wx.navigateBack();
          }
        }
      });
      return true; // 阻止默认返回行为
    }
    return false; // 允许正常返回
  }
});