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
      
      // 检查是否已存在相同ID的记录，防止重复保存
      const existingRecord = history.find(item => item.id === record.id)
      if (existingRecord) {
        console.log('记录已存在，跳过保存:', record.id)
        return
      }
      
      history.unshift(record)
      wx.setStorageSync('focusHistory', history)
      
      // 更新总专注时间 - 确保duration是数字类型且为分钟
      let totalTime = parseInt(wx.getStorageSync('totalFocusTime')) || 0
      const duration = parseInt(record.duration) || 0 // 确保是整数分钟
      
      // 验证duration的合理性（1-180分钟）
      if (duration < 1 || duration > 180) {
        console.error('异常的duration值:', duration, '原始值:', record.duration)
        return
      }
      
      totalTime += duration
      wx.setStorageSync('totalFocusTime', totalTime)
      
      this.globalData.focusHistory = history
      this.globalData.totalFocusTime = totalTime
      
      console.log('保存专注记录成功:', {
        recordId: record.id,
        duration: duration,
        newTotalTime: totalTime,
        historyCount: history.length
      })
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
      const totalTime = parseInt(wx.getStorageSync('totalFocusTime')) || 0
      this.globalData.totalFocusTime = totalTime
      return totalTime
    } catch (e) {
      console.error('获取总专注时间失败', e)
      return 0
    }
  }
})