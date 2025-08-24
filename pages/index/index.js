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
    canStart: false,
    selectedRoute: null // 记录选中的热门航线
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
              // 显示定位中提示
              wx.showLoading({
                title: '定位中...'
              });
              
              // 授权成功，获取位置
              wx.getLocation({
                type: 'gcj02',
                success: (locationRes) => {
                  wx.hideLoading();
                  const { latitude, longitude } = locationRes;
                  console.log('获取到位置:', latitude, longitude);
                  
                  const nearestCity = this.findNearestCity(latitude, longitude);
                  if (nearestCity) {
                    this.setData({
                      fromCity: nearestCity
                    });
                    wx.showToast({
                      title: `已定位到${nearestCity.name}`,
                      icon: 'success'
                    });
                  } else {
                    wx.showToast({
                      title: '未找到附近城市',
                      icon: 'none'
                    });
                    this.setDefaultCity();
                  }
                },
                fail: (err) => {
                  wx.hideLoading();
                  console.error('定位失败:', err);
                  wx.showToast({
                    title: '定位失败，请检查GPS设置',
                    icon: 'none'
                  });
                  this.setDefaultCity();
                }
              });
            },
            fail: () => {
              wx.showToast({
                title: '需要位置权限才能定位',
                icon: 'none'
              });
              this.setDefaultCity();
            }
          });
        } else {
          // 用户取消授权，设置默认城市
          this.setDefaultCity();
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
      // 排除虚拟城市（如"家"、"公司"）
      if (city.isVirtual) {
        return;
      }
      
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
    // 根据实际测试，选择能产生准确飞行时间的城市组合
    const routes = [
      { from: '家', to: '公司', id: 1 },      // 5分钟（特殊地点）
      { from: '北京', to: '天津', id: 2 },    // 10分钟（约137km）
      { from: '北京', to: '青岛', id: 3 },    // 15分钟（手动设置）
      { from: '北京', to: '石家庄', id: 4 },  // 20分钟（约283km）
      { from: '上海', to: '武汉', id: 5 }     // 30分钟（约839km，但手动调整为30分钟）
    ];

    const popularRoutes = routes.map(route => {
      const fromCity = cityUtils.getCityByName(route.from);
      const toCity = cityUtils.getCityByName(route.to);
      
      // 计算实际距离
      const distance = cityUtils.calculateDistance(
        fromCity.lat, fromCity.lng, 
        toCity.lat, toCity.lng
      );
      
      // 使用实际计算的飞行时间
      let duration = cityUtils.calculateFlightTime(distance);
      
      // 手动调整特定航线的时间以匹配用户期望
      if (route.id === 3) {
        duration = 15; // 北京到青岛：15分钟
      } else if (route.id === 5) {
        duration = 30; // 上海到武汉：30分钟
      }
      
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
        showCityModal: false,
        selectedRoute: null // 清除热门航线选择，使用实际计算时间
      });
    } else {
      this.setData({
        toCity: city,
        showCityModal: false,
        selectedRoute: null // 清除热门航线选择，使用实际计算时间
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
      toCity: route.toCity,
      selectedRoute: route // 保存选中的热门航线信息
    });
    this.updateFlightInfo();
  },

  // 更新航班信息
  updateFlightInfo() {
    const { fromCity, toCity, selectedRoute } = this.data;
    
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
    
    // 如果是从热门航线选择的，使用预设时间；否则使用计算时间
    let duration;
    if (selectedRoute && selectedRoute.duration) {
      duration = selectedRoute.duration; // 使用热门航线的预设时间
    } else {
      duration = cityUtils.calculateFlightTime(distance); // 使用计算时间
    }
    
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