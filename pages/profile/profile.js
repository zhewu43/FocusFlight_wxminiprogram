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
    
    // 启用分享菜单
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareTimeline', 'shareAppMessage']
    });
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadStatistics();
    this.loadWeekData();
    this.loadRecentFlights();
  },

  // 加载用户信息
  loadUserInfo() {
    let userInfo = wx.getStorageSync('userInfo') || {};
    let loginTimeText = '';
    
    // 确保每个用户都有飞行员ID（包括未登录用户）
    if (!userInfo.openId) {
      // 生成临时飞行员ID
      const tempId = this.generatePilotId();
      userInfo.openId = tempId;
      // 保存临时ID到本地存储
      wx.setStorageSync('userInfo', userInfo);
    }
    
    if (userInfo.loginTime) {
      const loginDate = new Date(userInfo.loginTime);
      loginTimeText = this.formatLoginTime(loginDate);
    }
    
    this.setData({ 
      userInfo,
      loginTimeText 
    });
  },

  // 生成飞行员ID
  generatePilotId() {
    // 生成格式：FF + 6位随机数字
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `FF${randomNum}`;
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

  // 分享给好友
  shareToFriend() {
    const { totalFlights, totalHours } = this.data;
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    });
  },

  // 分享到朋友圈
  shareToTimeline() {
    const { totalFlights, totalHours } = this.data;
    
    // 确保分享菜单可用
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareTimeline', 'shareAppMessage']
    });
    
    // 提示用户操作步骤
    wx.showModal({
      title: '分享到朋友圈',
      content: `您的专注成果：已完成${totalFlights}次专注飞行，累计${totalHours}！\n\n请点击右上角的"..."按钮，选择"分享到朋友圈"即可分享您的专注成果！`,
      showCancel: false,
      confirmText: '知道了',
      success: () => {
        // 显示操作提示
        wx.showToast({
          title: '请点击右上角菜单',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 页面分享处理
  onShareAppMessage() {
    const { totalFlights, totalHours } = this.data;
    return {
      title: `我在FocusFlight已完成${totalFlights}次专注飞行，累计${totalHours}！`,
      path: '/pages/index/index',
      imageUrl: '' // 可以设置分享图片路径
    };
  },

  // 分享到朋友圈（如果支持）
  onShareTimeline() {
    const { totalFlights, totalHours } = this.data;
    return {
      title: `我在FocusFlight已完成${totalFlights}次专注飞行，累计${totalHours}！`,
      imageUrl: '' // 可以设置分享图片路径
    };
  },

  // 完善用户信息登录
  completeUserLogin(userInfo) {
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          // 获取当前的临时用户信息
          const currentUserInfo = wx.getStorageSync('userInfo') || {};
          
          // 这里需要将code发送到后端服务器换取openid和session_key
          // 由于是演示版本，我们生成一个更真实的飞行员ID
          const authenticatedPilotId = this.generateAuthenticatedPilotId();
          
          const completeUserInfo = {
            ...currentUserInfo, // 保留临时数据
            ...userInfo, // 添加微信用户信息
            openId: authenticatedPilotId, // 使用认证后的飞行员ID
            loginTime: new Date().toISOString(),
            isAuthenticated: true // 标记为已认证用户
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

  // 生成认证后的飞行员ID
  generateAuthenticatedPilotId() {
    // 生成格式：FL + 8位数字（FL表示FocusFlight Licensed Pilot）
    const randomNum = Math.floor(10000000 + Math.random() * 90000000);
    return `FL${randomNum}`;
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
      content: '专注力管理小程序\n版本：1.1.7\n\n通过模拟航班飞行的方式，让专注变得更有趣！',
      showCancel: false,
      confirmText: '知道了'
    });
  }
});