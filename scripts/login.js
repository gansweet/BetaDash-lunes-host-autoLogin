// scripts/login.js
const { chromium } = require('playwright');
const axios = require('axios');
const fs = require('fs');

const LUNES_USERNAME = process.env.LUNES_USERNAME;
const LUNES_PASSWORD = process.env.LUNES_PASSWORD;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

const LOGIN_URL = 'https://ctrl.lunes.host/auth/login';
const DASHBOARD_URL = 'https://ctrl.lunes.host/';

async function sendTelegramMessage(message, photoPath = null) {
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const photoUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;

  if (photoPath && fs.existsSync(photoPath)) {
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('caption', message);
    formData.append('photo', fs.createReadStream(photoPath));
    await axios.post(photoUrl, formData, { headers: formData.getHeaders() });
  } else {
    await axios.post(url, { chat_id: TELEGRAM_CHAT_ID, text: message });
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle' });

    // 填写账号密码
    await page.fill('input[name="username"]', LUNES_USERNAME);
    await page.fill('input[name="password"]', LUNES_PASSWORD);

    // 登录按钮点击
    await page.click('button[type="submit"]');

    // 等待跳转到控制台
    await page.waitForURL(/dashboard|^https:\/\/ctrl\.lunes\.host\/$/, { timeout: 15000 });

    const loginScreenshot = 'login-success.png';
    await page.screenshot({ path: loginScreenshot, fullPage: true });

    await sendTelegramMessage('✅ 登录成功，已进入控制台界面！', loginScreenshot);

    // ✅ 点击进入 Pterodactyl 面板
    await page.waitForSelector('a.GreyRowBox-sc-1xo9c6v-0'); // 确保按钮加载
    const button = await page.$('a.GreyRowBox-sc-1xo9c6v-0');

    if (button) {
      await button.click();
      await page.waitForURL(/\/server\//, { timeout: 15000 }); // 等待进入 server 页面

      const serverScreenshot = 'pterodactyl-panel.png';
      await page.screenshot({ path: serverScreenshot, fullPage: true });

      await sendTelegramMessage('✅ 已进入 VPS 操作界面（Pterodactyl 面板）！', serverScreenshot);
    } else {
      await sendTelegramMessage('⚠️ 登录成功，但未找到 VPS 面板入口按钮！');
    }
  } catch (error) {
    const errorScreenshot = 'error.png';
    await page.screenshot({ path: errorScreenshot, fullPage: true });
    await sendTelegramMessage(`❌ 执行出错：${error.message}`, errorScreenshot);
  } finally {
    await browser.close();
  }
})();
