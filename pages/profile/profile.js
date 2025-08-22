// pages/profile/profile.js
const cityUtils = require('../../utils/cities.js');

Page({
  data: {
    userInfo: {},
    loginTimeText: '',
    totalFlights: 0,
    totalHours: '0h',
    totalDistance: 0,
    continuousDays: 0,
    weekData: [],
    weekTotal: 0,
    recentFlights: []
  },

  onLoad() {
    this.loadUserInfo();
    this.loadStatistics();
    this.loadWeekData();
    this.loadRecentFlights();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadStatistics();
    this.loadWeekData();
    this.loadRecentFlights();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {};
    let loginTimeText = '';
    
    if (userInfo.loginTime) {
      const loginDate = new Date(userInfo.loginTime);
      loginTimeText = this.formatLoginTime(loginDate);
    }
    
    this.setData({ 
      userInfo,
      loginTimeText 
    });
  },

  // 格式化登录时间
  formatLoginTime(date) {
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `今天 ${hours}:${minutes}`;
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day}`;
    }
  },

  // 获取用户信息
  getUserInfo() {
    // 先获取用户基本信息
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo;
        
        // 完成登录流程
        this.completeUserLogin(userInfo);
      },
      fail: () => {
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  // 获取手机号
  getPhoneNumber(e) {
    console.log('获取手机号回调', e);
    
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 这里需要将encryptedData和iv发送到后端解密获取真实手机号
      // 演示版本中我们模拟一个手机号
      const currentUserInfo = this.data.userInfo;
      const updatedUserInfo = {
        ...currentUserInfo,
        phoneNumber: '138****8888', // 演示用手机号
        hasPhone: true
      };
      
      wx.setStorageSync('userInfo', updatedUserInfo);
      this.setData({ userInfo: updatedUserInfo });
      
      wx.showToast({
        title: '手机号获取成功',
        icon: 'success'
      });
    } else {
      wx.showToast({
        title: '手机号获取失败',
        icon: 'none'
      });
    }
  },

  // 完善用户信息登录
  completeUserLogin(userInfo) {
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          // 这里需要将code发送到后端服务器换取openid和session_key
          // 由于是演示版本，我们先保存基本信息
          const completeUserInfo = {
            ...userInfo,
            openId: 'fl_' + Date.now(), // 演示用的openId，使用fl前缀表示FocusFlight
            loginTime: new Date().toISOString()
          };
          
          wx.setStorageSync('userInfo', completeUserInfo);
          const loginTimeText = this.formatLoginTime(new Date());
          this.setData({ 
            userInfo: completeUserInfo,
            loginTimeText 
          });
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },

  // 加载统计数据
  loadStatistics() {
    const app = getApp();
    const focusHistory = app.getFocusHistory();
    const totalFocusTime = app.getTotalFocusTime();

    // 计算总航班数
    const totalFlights = focusHistory.filter(record => record.completed).length;

    // 计算总飞行时长
    const totalHours = this.formatHours(totalFocusTime);

    // 计算总里程
    const totalDistance = focusHistory
      .filter(record => record.completed)
      .reduce((sum, record) => sum + (record.distance || 0), 0);

    // 计算连续天数
    const continuousDays = this.calculateContinuousDays(focusHistory);

    this.setData({
      totalFlights,
      totalHours,
      totalDistance,
      continuousDays
    });
  },

  // 格式化小时显示
  formatHours(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
    } else {
      return `${mins}m`;
    }
  },

  // 计算连续专注天数
  calculateContinuousDays(history) {
    if (history.length === 0) return 0;

    const completedRecords = history.filter(record => record.completed);
    if (completedRecords.length === 0) return 0;

    // 按日期分组
    const dateGroups = {};
    completedRecords.forEach(record => {
      const date = new Date(record.endTime).toDateString();
      if (!dateGroups[date]) {
        dateGroups[date] = [];
      }
      dateGroups[date].push(record);
    });

    // 获取有专注记录的日期，按时间倒序排列
    const dates = Object.keys(dateGroups).sort((a, b) => new Date(b) - new Date(a));
    
    let continuousDays = 0;
    const today = new Date().toDateString();
    
    for (let i = 0; i < dates.length; i++) {
      const currentDate = new Date(dates[i]);
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      
      if (currentDate.toDateString() === expectedDate.toDateString()) {
        continuousDays++;
      } else {
        break;
      }
    }

    return continuousDays;
  },

  // 加载本周数据
  loadWeekData() {
    const app = getApp();
    const focusHistory = app.getFocusHistory();
    
    // 获取本周的日期范围
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // 周日为一周开始
    
    const weekData = [];
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    let weekTotal = 0;

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateString = date.toDateString();
      
      // 计算当天的专注时长
      const dayRecords = focusHistory.filter(record => {
        const recordDate = new Date(record.endTime).toDateString();
        return recordDate === dateString && record.completed;
      });
      
      const dayTotal = dayRecords.reduce((sum, record) => sum + record.duration, 0);
      weekTotal += dayTotal;
      
      weekData.push({
        day: dayNames[i],
        minutes: dayTotal,
        height: Math.max(10, (dayTotal / 120) * 100) // 最大高度对应2小时
      });
    }

    this.setData({
      weekData,
      weekTotal
    });
  },

  // 加载最近航班记录
  loadRecentFlights() {
    const app = getApp();
    const focusHistory = app.getFocusHistory();
    
    // 取最近5条记录
    const recentFlights = focusHistory.slice(0, 5).map(record => ({
      ...record,
      durationText: cityUtils.formatTime(record.duration),
      dateText: this.formatDate(record.endTime)
    }));

    this.setData({ recentFlights });
  },

  // 格式化日期显示
  formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return '今天';
    } else if (diffDays === 1) {
      return '昨天';
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return `${month}/${day}`;
    }
  },

  // 查看全部航班记录
  viewAllFlights() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 前往设置页面
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  },

  // 清除数据
  clearData() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有专注记录吗？此操作不可恢复。',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.removeStorageSync('focusHistory');
            wx.removeStorageSync('totalFocusTime');
            
            // 重置全局数据
            const app = getApp();
            app.globalData.focusHistory = [];
            app.globalData.totalFocusTime = 0;
            
            // 刷新页面数据
            this.loadStatistics();
            this.loadWeekData();
            this.loadRecentFlights();
            
            wx.showToast({
              title: '数据已清除',
              icon: 'success'
            });
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
      content: '专注力管理小程序\n版本：1.0.0\n\n通过模拟航班飞行的方式，让专注变得更有趣！',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});