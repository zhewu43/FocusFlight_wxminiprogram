// pages/calendar/calendar.js
const cityUtils = require('../../utils/cities.js');

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    calendarDays: [],
    focusRecords: {},
    monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', 
                 '7月', '8月', '9月', '10月', '11月', '12月'],
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    totalFocusDays: 0,
    currentMonthFocusDays: 0
  },

  onLoad() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth()
    });
    
    this.loadFocusRecords();
    this.generateCalendar();
  },

  // 加载专注记录
  loadFocusRecords() {
    const app = getApp();
    const focusHistory = app.getFocusHistory();
    
    // 按日期分组专注记录
    const records = {};
    let totalFocusDays = 0;
    
    focusHistory.forEach(record => {
      if (record.completed) {
        const date = new Date(record.endTime);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        
        if (!records[dateKey]) {
          records[dateKey] = {
            date: date,
            flights: [],
            totalDuration: 0
          };
          totalFocusDays++;
        }
        
        records[dateKey].flights.push(record);
        records[dateKey].totalDuration += (record.duration || 0);
      }
    });

    this.setData({
      focusRecords: records,
      totalFocusDays: totalFocusDays
    });
  },

  // 生成日历
  generateCalendar() {
    const { currentYear, currentMonth, focusRecords } = this.data;
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    
    // 计算日历开始日期（当月第一天所在周的周日）
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    const calendarDays = [];
    let currentMonthFocusDays = 0;
    
    // 生成6周的日历，总共42天
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const isCurrentMonth = date.getMonth() === currentMonth;
      const isToday = this.isToday(date);
      const hasFocus = !!focusRecords[dateKey];
      
      if (isCurrentMonth && hasFocus) {
        currentMonthFocusDays++;
      }
      
      calendarDays.push({
        date: new Date(date), // 创建新的Date对象避免引用问题
        day: date.getDate(),
        isCurrentMonth: isCurrentMonth,
        isToday: isToday,
        hasFocus: hasFocus,
        focusData: focusRecords[dateKey] || null,
        dateKey: dateKey
      });
    }

    this.setData({
      calendarDays: calendarDays,
      currentMonthFocusDays: currentMonthFocusDays
    });
  },

  // 判断是否为今天
  isToday(date) {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  },

  // 上一个月
  prevMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    
    this.setData({
      currentYear: currentYear,
      currentMonth: currentMonth
    });
    
    this.generateCalendar();
  },

  // 下一个月
  nextMonth() {
    let { currentYear, currentMonth } = this.data;
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    
    this.setData({
      currentYear: currentYear,
      currentMonth: currentMonth
    });
    
    this.generateCalendar();
  },

  // 点击日期
  onDayTap(e) {
    const { day } = e.currentTarget.dataset;
    
    if (day.hasFocus) {
      const focusData = day.focusData;
      const flightList = focusData.flights.map(flight => 
        `${flight.fromCity} → ${flight.toCity} (${cityUtils.formatTime(flight.duration)})`
      ).join('\n');
      
      wx.showModal({
        title: `${day.date.getMonth() + 1}月${day.date.getDate()}日 专注记录`,
        content: `完成航班：${focusData.flights.length}次\n总时长：${cityUtils.formatTime(focusData.totalDuration)}\n\n航班详情：\n${flightList}`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 回到今天
  goToToday() {
    const now = new Date();
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth()
    });
    
    this.generateCalendar();
  }
});