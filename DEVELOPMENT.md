# FocusFlight 开发说明

## 项目结构

```
FocusFlight/
├── app.js                 # 小程序入口文件
├── app.json               # 小程序配置文件
├── app.wxss               # 全局样式文件
├── sitemap.json           # 站点地图配置
├── project.config.json    # 项目配置文件
├── utils/
│   └── cities.js          # 城市数据和工具函数
├── pages/
│   ├── index/             # 首页（航班选择）
│   │   ├── index.wxml
│   │   ├── index.wxss
│   │   └── index.js
│   ├── focus/             # 专注页面（计时器）
│   │   ├── focus.wxml
│   │   ├── focus.wxss
│   │   └── focus.js
│   ├── profile/           # 个人中心
│   │   ├── profile.wxml
│   │   ├── profile.wxss
│   │   └── profile.js
│   └── settings/          # 设置页面
│       ├── settings.wxml
│       ├── settings.wxss
│       └── settings.js
├── README.md              # 项目说明
├── PRD.md                 # 产品需求文档
└── DEVELOPMENT.md         # 开发说明
```

## 核心功能

### 1. 航班选择系统
- 基于城市间距离计算飞行时间
- 支持起始地和目的地选择
- 热门航线推荐
- 实时航班信息生成

### 2. 专注计时器
- 倒计时显示
- 进度圆环动画
- 暂停/继续功能
- 完成庆祝动画

### 3. 数据统计
- 专注历史记录
- 本周专注统计
- 总飞行里程统计
- 连续专注天数

### 4. 用户系统
- 微信登录集成
- 个人信息展示
- 设置个性化配置

### 5. 社交分享系统
- 分享给好友功能
- 分享到朋友圈功能
- 动态分享内容生成
- 分享按钮UI设计

### 6. 飞行员ID系统
- 自动ID分配机制
- 临时用户和认证用户区分
- ID格式化和显示
- 登录状态管理

### 7. 智能定位系统
- 精确地理定位
- 虚拟城市过滤
- 定位错误处理
- 用户反馈优化

### 8. 热门航线时间修复
- 预设时间与计算时间分离
- 状态管理优化
- 时间一致性保证

## 技术特点

### 数据存储
- 使用微信小程序本地存储API
- 支持数据导出功能
- 预留云存储扩展接口

### 算法实现
- Haversine公式计算地球表面两点距离
- 基于距离的飞行时间计算
- 智能时间范围控制（15分钟-3小时）

### 社交分享实现
- 微信小程序原生分享API集成
- 动态分享内容模板系统
- 分享按钮响应式UI设计
- 朋友圈分享权限配置

### UI/UX设计
- 航空主题设计风格
- 渐变色彩搭配
- 流畅的动画效果
- 响应式布局

## 开发环境设置

### 1. 微信开发者工具
- 下载并安装微信开发者工具
- 导入项目目录
- 配置AppID（需要注册小程序）

### 2. 项目配置
- 修改 `project.config.json` 中的 `appid`
- 根据需要调整编译设置

### 3. 调试运行
- 在微信开发者工具中点击"编译"
- 使用模拟器或真机预览

## 部署发布

### 1. 代码审查
- 检查所有功能是否正常
- 测试各种边界情况
- 优化性能和用户体验

### 2. 版本管理
- 更新版本号
- 编写版本更新日志
- 提交代码到版本控制系统

### 3. 小程序发布
- 在微信开发者工具中上传代码
- 在微信公众平台提交审核
- 审核通过后发布上线

## 代码架构更新

### V1.2.0 重要修复架构

#### 1. 热门航线时间一致性修复
**问题**：热门航线显示时间与实际专注时间不匹配
**解决方案**：
```javascript
// pages/index/index.js 新增状态管理
data: {
  selectedRoute: null // 记录选中的热门航线
}

// 智能时间计算逻辑
updateFlightInfo() {
  if (selectedRoute && selectedRoute.duration) {
    duration = selectedRoute.duration; // 使用预设时间
  } else {
    duration = cityUtils.calculateFlightTime(distance); // 使用计算时间
  }
}
```

#### 2. 定位功能精度修复
**问题**：定位显示"家"而非真实地理位置
**解决方案**：
```javascript
// utils/cities.js 数据结构优化
{ id: 0, name: '家', lat: 0, lng: 0, code: 'HOME', isVirtual: true }

// pages/index/index.js 定位算法改进
findNearestCity(lat, lng) {
  cities.forEach(city => {
    if (city.isVirtual) return; // 排除虚拟城市
    // 只在真实城市中查找最近位置
  });
}
```

#### 3. 飞行员ID系统实现
**功能**：为所有用户自动分配飞行员ID
**实现**：
```javascript
// pages/profile/profile.js 新增方法
generatePilotId() {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `FF${randomNum}`; // 临时ID：FF + 6位数字
}

generateAuthenticatedPilotId() {
  const randomNum = Math.floor(10000000 + Math.random() * 90000000);
  return `FL${randomNum}`; // 认证ID：FL + 8位数字
}
```

### 社交分享功能架构

#### 1. 前端实现 (pages/profile/)
**profile.js 新增方法：**
```javascript
// 分享给好友
shareToFriend() - 调用微信分享给好友功能
// 分享到朋友圈  
shareToTimeline() - 调用微信分享到朋友圈功能
// 分享回调处理
onShareAppMessage() - 处理分享给好友的内容生成
onShareTimeline() - 处理分享到朋友圈的内容生成
```

**profile.wxml 布局结构：**
```xml
<view class="share-actions">
  <button class="share-btn friend-share" open-type="share">
    分享给好友
  </button>
  <button class="share-btn timeline-share" bindtap="shareToTimeline">
    分享朋友圈
  </button>
</view>
```

**profile.wxss 样式设计：**
- 上下排列布局 (flex-direction: column)
- 按钮宽度：190-230rpx 自适应
- 差异化颜色主题：绿色(好友) + 黄色(朋友圈)

#### 2. 配置更新 (app.json)
```json
{
  "shareAppMessage": {
    "title": "FocusFlight - 专注力管理小程序",
    "path": "/pages/index/index"
  },
  "shareTimeline": {
    "title": "我在FocusFlight完成了专注飞行！",
    "path": "/pages/index/index"
  }
}
```

## 扩展功能规划

### V1.1 功能 (已完成)
- ✅ 社交分享系统
- ✅ 分享到朋友圈功能
- ✅ 分享按钮UI优化

### V2.0 功能
- 云端数据同步
- 好友系统和排行榜
- 更多游戏化元素
- 专注模式多样化

### V3.0 功能
- AI智能推荐
- 数据分析报告
- 社区功能
- 跨平台同步

## 注意事项

1. **隐私保护**：确保用户数据安全，遵守相关法规
2. **性能优化**：注意内存使用，避免内存泄漏
3. **兼容性**：测试不同机型和系统版本
4. **用户体验**：保持界面简洁，操作流畅
5. **错误处理**：完善异常处理机制

## 联系方式

如有问题或建议，请联系开发团队：
- 邮箱：dev@focusflight.com
- 微信群：FocusFlight开发者群