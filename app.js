// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功', res.code)
      }
    })
  },
  
  globalData: {
    userInfo: null,
    focusHistory: [],
    totalFocusTime: 0
  },

  // 保存专注记录
  saveFocusRecord(record) {
    try {
      let history = wx.getStorageSync('focusHistory') || []
      history.unshift(record)
      wx.setStorageSync('focusHistory', history)
      
      // 更新总专注时间
      let totalTime = wx.getStorageSync('totalFocusTime') || 0
      totalTime += record.duration
      wx.setStorageSync('totalFocusTime', totalTime)
      
      this.globalData.focusHistory = history
      this.globalData.totalFocusTime = totalTime
    } catch (e) {
      console.error('保存专注记录失败', e)
    }
  },

  // 获取专注历史
  getFocusHistory() {
    try {
      const history = wx.getStorageSync('focusHistory') || []
      this.globalData.focusHistory = history
      return history
    } catch (e) {
      console.error('获取专注历史失败', e)
      return []
    }
  },

  // 获取总专注时间
  getTotalFocusTime() {
    try {
      const totalTime = wx.getStorageSync('totalFocusTime') || 0
      this.globalData.totalFocusTime = totalTime
      return totalTime
    } catch (e) {
      console.error('获取总专注时间失败', e)
      return 0
    }
  }
})