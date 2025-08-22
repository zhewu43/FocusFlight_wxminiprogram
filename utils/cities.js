// 中国主要城市数据
const cities = [
  { id: 1, name: '北京', lat: 39.9042, lng: 116.4074, code: 'BJS' },
  { id: 2, name: '上海', lat: 31.2304, lng: 121.4737, code: 'SHA' },
  { id: 3, name: '广州', lat: 23.1291, lng: 113.2644, code: 'CAN' },
  { id: 4, name: '深圳', lat: 22.5431, lng: 114.0579, code: 'SZX' },
  { id: 5, name: '杭州', lat: 30.2741, lng: 120.1551, code: 'HGH' },
  { id: 6, name: '南京', lat: 32.0603, lng: 118.7969, code: 'NKG' },
  { id: 7, name: '武汉', lat: 30.5928, lng: 114.3055, code: 'WUH' },
  { id: 8, name: '成都', lat: 30.6624, lng: 104.0633, code: 'CTU' },
  { id: 9, name: '重庆', lat: 29.5647, lng: 106.5507, code: 'CKG' },
  { id: 10, name: '西安', lat: 34.3416, lng: 108.9398, code: 'XIY' },
  { id: 11, name: '天津', lat: 39.3434, lng: 117.3616, code: 'TSN' },
  { id: 12, name: '苏州', lat: 31.2989, lng: 120.5853, code: 'SZV' },
  { id: 13, name: '青岛', lat: 36.0671, lng: 120.3826, code: 'TAO' },
  { id: 14, name: '大连', lat: 38.9140, lng: 121.6147, code: 'DLC' },
  { id: 15, name: '厦门', lat: 24.4798, lng: 118.0819, code: 'XMN' },
  { id: 16, name: '济南', lat: 36.6512, lng: 117.1201, code: 'TNA' },
  { id: 17, name: '沈阳', lat: 41.8057, lng: 123.4315, code: 'SHE' },
  { id: 18, name: '长沙', lat: 28.2282, lng: 112.9388, code: 'CSX' },
  { id: 19, name: '郑州', lat: 34.7466, lng: 113.6254, code: 'CGO' },
  { id: 20, name: '昆明', lat: 25.0389, lng: 102.7183, code: 'KMG' },
  { id: 21, name: '福州', lat: 26.0745, lng: 119.2965, code: 'FOC' },
  { id: 22, name: '合肥', lat: 31.8206, lng: 117.2272, code: 'HFE' },
  { id: 23, name: '石家庄', lat: 38.0428, lng: 114.5149, code: 'SJW' },
  { id: 24, name: '太原', lat: 37.8706, lng: 112.5489, code: 'TYN' },
  { id: 25, name: '南昌', lat: 28.6820, lng: 115.8581, code: 'KHN' },
  { id: 26, name: '哈尔滨', lat: 45.8038, lng: 126.5349, code: 'HRB' },
  { id: 27, name: '长春', lat: 43.8171, lng: 125.3235, code: 'CGQ' },
  { id: 28, name: '南宁', lat: 22.8170, lng: 108.3669, code: 'NNG' },
  { id: 29, name: '海口', lat: 20.0458, lng: 110.3417, code: 'HAK' },
  { id: 30, name: '贵阳', lat: 26.6477, lng: 106.6302, code: 'KWE' }
];

// 根据城市名称查找城市信息
function getCityByName(name) {
  return cities.find(city => city.name === name);
}

// 根据城市ID查找城市信息
function getCityById(id) {
  return cities.find(city => city.id === id);
}

// 获取所有城市列表
function getAllCities() {
  return cities;
}

// 计算两点间距离（使用Haversine公式）
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 地球半径，单位：公里
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance);
}

// 根据距离计算飞行时间（分钟）
function calculateFlightTime(distance) {
  const speed = 800; // 平均飞行速度 km/h
  const timeInHours = distance / speed;
  let timeInMinutes = Math.round(timeInHours * 60);
  
  // 限制在15分钟-180分钟范围内
  timeInMinutes = Math.max(15, Math.min(180, timeInMinutes));
  
  // 调整为5分钟的倍数
  timeInMinutes = Math.round(timeInMinutes / 5) * 5;
  
  return timeInMinutes;
}

// 生成航班号
function generateFlightNumber(fromCity, toCity) {
  const prefix = 'FF'; // FocusFlight
  const fromCode = fromCity.code.substring(0, 2);
  const toCode = toCity.code.substring(0, 2);
  const randomNum = Math.floor(Math.random() * 900) + 100;
  return `${prefix}${fromCode}${toCode}${randomNum}`;
}

// 格式化时间显示
function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
  } else {
    return `${mins}分钟`;
  }
}

module.exports = {
  cities,
  getCityByName,
  getCityById,
  getAllCities,
  calculateDistance,
  calculateFlightTime,
  generateFlightNumber,
  formatTime
};