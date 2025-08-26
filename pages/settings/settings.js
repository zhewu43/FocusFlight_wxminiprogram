// pages/settings/settings.js
const cityUtils = require('../../utils/cities.js');

Page({
  data: {
    defaultCity: {},
    soundEnabled: true,
    vibrationEnabled: true,
    minDuration: 5,
    maxDuration: 180,
    autoPauseEnabled: true,
    showCityModal: false,
    showTimeModal: false,
    timeModalTitle: '',
    timeModalType: '', // 'min' 或 'max'
    timePickerValue: [0],
    timeOptions: [],
    cities: []
  },

  onLoad() {
    this.loadSettings();
    this.loadCities();
  },

  // 加载设置
  loadSettings() {
    try {
      const settings = wx.getStorageSync('appSettings') || {};
      const defaultCity = settings.defaultCity || cityUtils.getCityByName('北京');
      
      this.setData({
        defaultCity,
        soundEnabled: settings.soundEnabled !== false,
        vibrationEnabled: settings.vibrationEnabled !== false,
        minDuration: settings.minDuration || 5,
        maxDuration: settings.maxDuration || 180,
        autoPauseEnabled: settings.autoPauseEnabled !== false
      });
    } catch (e) {
      console.error('加载设置失败', e);
    }
  },

  // 保存设置
  saveSettings() {
    try {
      const settings = {
        defaultCity: this.data.defaultCity,
        soundEnabled: this.data.soundEnabled,
        vibrationEnabled: this.data.vibrationEnabled,
        minDuration: this.data.minDuration,
        maxDuration: this.data.maxDuration,
        autoPauseEnabled: this.data.autoPauseEnabled
      };
      wx.setStorageSync('appSettings', settings);
    } catch (e) {
      console.error('保存设置失败', e);
    }
  },

  // 加载城市列表
  loadCities() {
    const cities = cityUtils.getAllCities();
    this.setData({ cities });
  },

  // 选择默认城市
  selectDefaultCity() {
    this.setData({
      showCityModal: true
    });
  },

  // 选择城市
  selectCity(e) {
    const city = e.currentTarget.dataset.city;
    this.setData({
      defaultCity: city,
      showCityModal: false
    });
    this.saveSettings();
    
    if (this.data.vibrationEnabled) {
      wx.vibrateShort();
    }
  },

  // 关闭城市选择弹窗
  closeCityModal() {
    this.setData({
      showCityModal: false
    });
  },

  // 切换声音设置
  toggleSound(e) {
    const soundEnabled = e.detail.value;
    this.setData({ soundEnabled });
    this.saveSettings();
    
    if (this.data.vibrationEnabled) {
      wx.vibrateShort();
    }
  },

  // 切换震动设置
  toggleVibration(e) {
    const vibrationEnabled = e.detail.value;
    this.setData({ vibrationEnabled });
    this.saveSettings();
    
    if (vibrationEnabled) {
      wx.vibrateShort();
    }
  },

  // 切换自动暂停设置
  toggleAutoPause(e) {
    const autoPauseEnabled = e.detail.value;
    this.setData({ autoPauseEnabled });
    this.saveSettings();
    
    if (this.data.vibrationEnabled) {
      wx.vibrateShort();
    }
  },

  // 设置最短时间
  setMinDuration() {
    const timeOptions = [];
    for (let i = 5; i <= 60; i += 5) {
      timeOptions.push(i);
    }
    
    const currentIndex = timeOptions.indexOf(this.data.minDuration);
    
    this.setData({
      showTimeModal: true,
      timeModalTitle: '设置最短专注时间',
      timeModalType: 'min',
      timeOptions,
      timePickerValue: [currentIndex >= 0 ? currentIndex : 0] // 默认5分钟
    });
  },

  // 设置最长时间
  setMaxDuration() {
    const timeOptions = [];
    for (let i = 30; i <= 300; i += 15) {
      timeOptions.push(i);
    }
    
    const currentIndex = timeOptions.indexOf(this.data.maxDuration);
    
    this.setData({
      showTimeModal: true,
      timeModalTitle: '设置最长专注时间',
      timeModalType: 'max',
      timeOptions,
      timePickerValue: [currentIndex >= 0 ? currentIndex : 10] // 默认180分钟
    });
  },

  // 时间选择器变化
  onTimePickerChange(e) {
    this.setData({
      timePickerValue: e.detail.value
    });
  },

  // 确认时间修改
  confirmTimeChange() {
    const { timeModalType, timeOptions, timePickerValue } = this.data;
    const selectedTime = timeOptions[timePickerValue[0]];
    
    if (timeModalType === 'min') {
      if (selectedTime >= this.data.maxDuration) {
        wx.showToast({
          title: '最短时间不能大于等于最长时间',
          icon: 'none'
        });
        return;
      }
      this.setData({ minDuration: selectedTime });
    } else {
      if (selectedTime <= this.data.minDuration) {
        wx.showToast({
          title: '最长时间不能小于等于最短时间',
          icon: 'none'
        });
        return;
      }
      this.setData({ maxDuration: selectedTime });
    }
    
    this.setData({ showTimeModal: false });
    this.saveSettings();
    
    if (this.data.vibrationEnabled) {
      wx.vibrateShort();
    }
  },

  // 关闭时间设置弹窗
  closeTimeModal() {
    this.setData({
      showTimeModal: false
    });
  },

  // 导出数据
  exportData() {
    try {
      const app = getApp();
      const focusHistory = app.getFocusHistory();
      const totalFocusTime = app.getTotalFocusTime();
      
      const exportData = {
        exportTime: new Date().toISOString(),
        totalFocusTime,
        totalRecords: focusHistory.length,
        focusHistory
      };
      
      // 这里可以实现数据导出功能，比如生成文件或分享
      wx.showModal({
        title: '导出数据',
        content: `共有 ${focusHistory.length} 条专注记录\n总专注时长 ${Math.floor(totalFocusTime / 60)}小时${totalFocusTime % 60}分钟\n\n数据导出功能开发中...`,
        showCancel: false
      });
    } catch (e) {
      wx.showToast({
        title: '导出失败',
        icon: 'none'
      });
    }
  },

  // 清除所有数据
  clearAllData() {
    wx.showModal({
      title: '危险操作',
      content: '确定要清除所有数据吗？包括专注记录、设置等，此操作不可恢复！',
      confirmText: '确定清除',
      confirmColor: '#ff4d4f',
      success: (res) => {
        if (res.confirm) {
          try {
            // 清除所有存储数据
            wx.clearStorageSync();
            
            // 重置全局数据
            const app = getApp();
            app.globalData.focusHistory = [];
            app.globalData.totalFocusTime = 0;
            app.globalData.userInfo = null;
            
            wx.showToast({
              title: '数据已清除',
              icon: 'success'
            });
            
            // 重新加载默认设置
            setTimeout(() => {
              this.loadSettings();
            }, 1000);
            
          } catch (e) {
            wx.showToast({
              title: '清除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 关于应用
  aboutApp() {
    wx.showModal({
      title: 'FocusFlight',
      content: '专注力管理小程序\n\n通过模拟航班飞行的方式，让专注变得更有趣！\n\n开发者：Zivewu',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 意见反馈
  feedback() {
    wx.showModal({
      title: '意见反馈',
      content: '感谢您使用 FocusFlight！\n\n如有任何建议或问题，请通过以下方式联系我们：\n\n• 邮箱：zivewu@outlook.com\n\n 反馈功能开发中...(可能比较慢)',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});