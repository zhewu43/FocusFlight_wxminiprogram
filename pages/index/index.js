// pages/index/index.js
const cityUtils = require('../../utils/cities.js');

Page({
  data: {
    fromCity: {},
    toCity: {},
    flightInfo: {},
    popularRoutes: [],
    showCityModal: false,
    modalType: '', // 'from' 或 'to'
    availableCities: [],
    canStart: false
  },

  onLoad() {
    this.initData();
    this.loadPopularRoutes();
    this.getCurrentLocation();
  },

  // 初始化数据
  initData() {
    const cities = cityUtils.getAllCities();
    this.setData({
      availableCities: cities
    });
  },

  // 获取当前位置（优化版本，不强制要求地理位置权限）
  getCurrentLocation() {
    // 先尝试从设置中获取默认城市
    const settings = wx.getStorageSync('appSettings') || {};
    if (settings.defaultCity) {
      this.setData({
        fromCity: settings.defaultCity
      });
      return;
    }

    // 如果没有设置默认城市，尝试获取地理位置（可选）
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation']) {
          // 用户已授权，可以获取位置
          wx.getLocation({
            type: 'gcj02',
            success: (locationRes) => {
              const { latitude, longitude } = locationRes;
              const nearestCity = this.findNearestCity(latitude, longitude);
              if (nearestCity) {
                this.setData({
                  fromCity: nearestCity
                });
              }
            },
            fail: () => {
              this.setDefaultCity();
            }
          });
        } else {
          // 用户未授权或首次使用，直接设置默认城市
          this.setDefaultCity();
        }
      },
      fail: () => {
        this.setDefaultCity();
      }
    });
  },

  // 设置默认城市
  setDefaultCity() {
    const beijing = cityUtils.getCityByName('北京');
    this.setData({
      fromCity: beijing
    });
  },

  // 手动请求位置权限
  requestLocation() {
    wx.showModal({
      title: '获取位置信息',
      content: '是否允许获取您的位置信息，以便自动设置起飞城市？',
      confirmText: '允许',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              // 授权成功，获取位置
              wx.getLocation({
                type: 'gcj02',
                success: (locationRes) => {
                  const { latitude, longitude } = locationRes;
                  const nearestCity = this.findNearestCity(latitude, longitude);
                  if (nearestCity) {
                    this.setData({
                      fromCity: nearestCity
                    });
                    wx.showToast({
                      title: `已定位到${nearestCity.name}`,
                      icon: 'success'
                    });
                  }
                },
                fail: () => {
                  wx.showToast({
                    title: '定位失败',
                    icon: 'none'
                  });
                }
              });
            },
            fail: () => {
              wx.showToast({
                title: '位置权限被拒绝',
                icon: 'none'
              });
            }
          });
        }
      }
    });
  },

  // 查找最近的城市
  findNearestCity(lat, lng) {
    const cities = cityUtils.getAllCities();
    let nearestCity = null;
    let minDistance = Infinity;

    cities.forEach(city => {
      const distance = cityUtils.calculateDistance(lat, lng, city.lat, city.lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCity = city;
      }
    });

    return nearestCity;
  },

  // 加载热门航线
  loadPopularRoutes() {
    // 预设不同时长的专注航线，直接指定时长而不依赖距离计算
    const routes = [
      { from: '家', to: '公司', id: 1, targetDuration: 5 }, // 5分钟
      { from: '北京', to: '天津', id: 2, targetDuration: 10 }, // 10分钟
      { from: '上海', to: '苏州', id: 3, targetDuration: 15 }, // 15分钟
      { from: '北京', to: '石家庄', id: 4, targetDuration: 20 }, // 20分钟
      { from: '北京', to: '西安', id: 5, targetDuration: 30 }  // 30分钟
    ];

    // 为每条航线设置固定的时长
    const popularRoutes = routes.map(route => {
      const fromCity = cityUtils.getCityByName(route.from);
      const toCity = cityUtils.getCityByName(route.to);
      
      // 计算实际距离（用于显示）
      const distance = cityUtils.calculateDistance(
        fromCity.lat, fromCity.lng, 
        toCity.lat, toCity.lng
      );
      
      // 直接使用目标时长，不依赖距离计算
      const duration = route.targetDuration;
      
      return {
        ...route,
        fromCity,
        toCity,
        distance,
        duration,
        durationText: cityUtils.formatTime(duration)
      };
    });

    this.setData({
      popularRoutes
    });
  },

  // 选择起飞城市
  selectFromCity() {
    this.setData({
      showCityModal: true,
      modalType: 'from'
    });
  },

  // 选择目的地城市
  selectToCity() {
    this.setData({
      showCityModal: true,
      modalType: 'to'
    });
  },

  // 选择城市
  selectCity(e) {
    const city = e.currentTarget.dataset.city;
    const { modalType } = this.data;

    if (modalType === 'from') {
      this.setData({
        fromCity: city,
        showCityModal: false
      });
    } else {
      this.setData({
        toCity: city,
        showCityModal: false
      });
    }

    this.updateFlightInfo();
  },

  // 关闭城市选择弹窗
  closeCityModal() {
    this.setData({
      showCityModal: false
    });
  },

  // 选择热门航线
  selectRoute(e) {
    const route = e.currentTarget.dataset.route;
    this.setData({
      fromCity: route.fromCity,
      toCity: route.toCity
    });
    this.updateFlightInfo();
  },

  // 更新航班信息
  updateFlightInfo() {
    const { fromCity, toCity } = this.data;
    
    if (!fromCity.name || !toCity.name) {
      this.setData({
        flightInfo: {},
        canStart: false
      });
      return;
    }

    if (fromCity.id === toCity.id) {
      wx.showToast({
        title: '起飞地和目的地不能相同',
        icon: 'none'
      });
      return;
    }

    const distance = cityUtils.calculateDistance(
      fromCity.lat, fromCity.lng,
      toCity.lat, toCity.lng
    );
    
    const duration = cityUtils.calculateFlightTime(distance);
    const flightNumber = cityUtils.generateFlightNumber(fromCity, toCity);
    const departureTime = this.generateDepartureTime();

    this.setData({
      flightInfo: {
        flightNumber,
        distance,
        duration,
        durationText: cityUtils.formatTime(duration),
        departureTime
      },
      canStart: true
    });
  },

  // 生成起飞时间
  generateDepartureTime() {
    const now = new Date();
    const departure = new Date(now.getTime() + 5 * 60000); // 5分钟后起飞
    const hours = departure.getHours().toString().padStart(2, '0');
    const minutes = departure.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 开始专注
  startFocus() {
    const { fromCity, toCity, flightInfo } = this.data;
    
    if (!this.data.canStart) {
      wx.showToast({
        title: '请先选择航班',
        icon: 'none'
      });
      return;
    }

    // 跳转到专注页面
    wx.navigateTo({
      url: `/pages/focus/focus?fromCity=${fromCity.name}&toCity=${toCity.name}&duration=${flightInfo.duration}&flightNumber=${flightInfo.flightNumber}&distance=${flightInfo.distance}`
    });
  }
});