# 微信小程序用户信息获取指南

## 当前实现状态

目前的实现是**演示版本**，在真实的生产环境中需要配合后端服务器才能获取用户的真实信息。

## 生产环境完整实现步骤

### 1. 后端服务器配置

#### 1.1 获取小程序配置信息
- 在微信公众平台获取 `AppID` 和 `AppSecret`
- 配置服务器域名白名单

#### 1.2 创建登录接口
```javascript
// 后端登录接口示例 (Node.js)
app.post('/api/login', async (req, res) => {
  const { code } = req.body;
  
  try {
    // 1. 通过code换取session_key和openid
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: 'YOUR_APPID',
        secret: 'YOUR_APPSECRET',
        js_code: code,
        grant_type: 'authorization_code'
      }
    });
    
    const { openid, session_key } = response.data;
    
    // 2. 生成自定义登录态token
    const token = jwt.sign({ openid }, 'your-secret-key');
    
    res.json({
      success: true,
      token,
      openid
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
```

#### 1.3 创建手机号解密接口
```javascript
// 手机号解密接口
app.post('/api/getPhoneNumber', async (req, res) => {
  const { encryptedData, iv, sessionKey } = req.body;
  
  try {
    const crypto = require('crypto');
    const decipher = crypto.createDecipheriv('aes-128-cbc', 
      Buffer.from(sessionKey, 'base64'), 
      Buffer.from(iv, 'base64')
    );
    
    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    const phoneData = JSON.parse(decrypted);
    
    res.json({
      success: true,
      phoneNumber: phoneData.phoneNumber
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
```

### 2. 小程序端修改

#### 2.1 修改登录逻辑
```javascript
// pages/profile/profile.js
getUserInfo() {
  wx.getUserProfile({
    desc: '用于完善用户资料',
    success: (res) => {
      const userInfo = res.userInfo;
      
      // 获取登录凭证
      wx.login({
        success: (loginRes) => {
          if (loginRes.code) {
            // 发送code到后端
            wx.request({
              url: 'https://your-domain.com/api/login',
              method: 'POST',
              data: { code: loginRes.code },
              success: (response) => {
                if (response.data.success) {
                  const completeUserInfo = {
                    ...userInfo,
                    openId: response.data.openid,
                    token: response.data.token,
                    loginTime: new Date().toISOString()
                  };
                  
                  wx.setStorageSync('userInfo', completeUserInfo);
                  wx.setStorageSync('token', response.data.token);
                  
                  this.setData({ userInfo: completeUserInfo });
                  wx.showToast({ title: '登录成功', icon: 'success' });
                }
              }
            });
          }
        }
      });
    }
  });
}
```

#### 2.2 修改手机号获取
```javascript
getPhoneNumber(e) {
  if (e.detail.errMsg === 'getPhoneNumber:ok') {
    const { encryptedData, iv } = e.detail;
    const sessionKey = wx.getStorageSync('sessionKey');
    
    wx.request({
      url: 'https://your-domain.com/api/getPhoneNumber',
      method: 'POST',
      data: { encryptedData, iv, sessionKey },
      success: (response) => {
        if (response.data.success) {
          const userInfo = this.data.userInfo;
          userInfo.phoneNumber = response.data.phoneNumber;
          
          wx.setStorageSync('userInfo', userInfo);
          this.setData({ userInfo });
          
          wx.showToast({ title: '手机号获取成功', icon: 'success' });
        }
      }
    });
  }
}
```

### 3. 配置要求

#### 3.1 小程序配置
在 `app.json` 中添加服务器域名：
```json
{
  "networkTimeout": {
    "request": 10000
  },
  "permission": {
    "scope.userLocation": {
      "desc": "获取您的位置信息，用于确定起始城市"
    }
  }
}
```

#### 3.2 服务器域名配置
在微信公众平台的"开发管理" -> "开发设置" -> "服务器域名"中配置：
- request合法域名：`https://your-domain.com`

### 4. 安全注意事项

1. **AppSecret保护**：绝不能在小程序端存储AppSecret
2. **数据加密**：敏感数据传输必须使用HTTPS
3. **Token管理**：实现token过期和刷新机制
4. **用户隐私**：遵守《个人信息保护法》等相关法规

### 5. 测试建议

1. **开发环境**：使用微信开发者工具测试
2. **真机测试**：在真实设备上测试登录流程
3. **边界测试**：测试网络异常、用户拒绝授权等情况

## 当前演示版本说明

当前代码中的用户信息获取是**模拟实现**，主要用于：
- 演示UI交互流程
- 本地开发和测试
- 展示功能完整性

在实际部署时，请按照上述指南实现完整的后端服务。

## 相关文档

- [微信小程序登录文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
- [获取手机号文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/getPhoneNumber.html)
- [用户信息文档](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/userInfo.html)