// 2.0 引入 superagent 包,用于服务器发送http请求
const request = require('superagent');
// 3.0 导入cheerio,把字符串解析成HTML
const cheerio = require('cheerio');
// 4.0 导入模板引擎
const template = require('art-template');
// 导入 path 模块处理路径
const path = require('path');
// 5.0 导入  发送邮件发送模块
const nodemailer = require("nodemailer");
// 6.1 导入 定时任务模块
var schedule = require('node-schedule');

// 1.0 计算交往的天数
function getDayData () {
  return new Promise((resolve, reject) => {
    // 现在的时间
    const today = new Date();
    // 交往的时间
    const meet = new Date('2017-10-30');
    // 计算相识到今天的天数
    const count = Math.ceil((today - meet) / 1000 / 60 / 60 / 24);
    // console.log(count);
    // 今天日期格式化
    const format = today.getFullYear() + ' / ' + (today.getMonth() + 1) + ' / ' + today.getDate();

    const dayData = {
      count,
      format
    }
    // console.log(dayData);
    resolve(dayData);
  })
}

// getData();

// 2.0.1 请求墨迹天气获取数据
function getMojiData() {
  return new Promise((resolve, reject) => {
    request.get('https://tianqi.moji.com/weather/china/guangdong/guangzhou').end((err, res) => {
      if (err) return console.log("数据请求失败,请检查路径");
      // console.log(res);
      // 把字符串解析成HTML,并用jQuery核心选择器获取内容
      const $ = cheerio.load(res.text);
      // 图标
      const icon = $('.wea_weather span img').attr('src');
      // 天气
      const weather = $('.wea_weather b').text();
      // 温度
      const temperature = $('.wea_weather em').text();
      // 提示
      const tips = $('.wea_tips em').text();
      const mojiData = {
        icon,
        weather,
        temperature,
        tips
      }
      // console.log(mojiData);
      resolve(mojiData);
    })
  })
}
// getMojiData();

// 3.1 请求 One 页面抓取数据
function getOneData() {
  return new Promise((resolve, reject) => {
    request.get('http://wufazhuce.com/').end((err, res) => {
      if (err) return console.log('请求失败');
  
      // 把返回值中的页面解析成HTML
      const $ = cheerio.load(res.text);
      // 抓取 one 图片
      const img = $('.carousel-inner>.item>img, .carousel-inner>.item>a>img').eq(0).attr('src');
      // 抓取 one 文本
      const text = $('.fp-one .fp-one-cita-wrapper .fp-one-cita a').text();
      const oneData = {
        img,
        text
      }
      // console.log(oneData);
      resolve(oneData);
    })
  })
}
// getOneData();

// 4.1 通过模板引擎替换HTML的数据
async function renderTemplate () {
  // 获取 日期
  const dayData = await getDayData();
  // 获取 墨迹天气数据
  const mojiData = await getMojiData();
  // 获取 one 数据
  const oneData = await getOneData();

  // console.log(dayData);
  // console.log(mojiData);
  // console.log(oneData);
  // 所有数据获取成功的时候才进行模板引擎数据的替换
  return new Promise((resolve, reject) => {
    const html = template(path.join(__dirname, './love.html'), {
      dayData,
      mojiData,
      oneData
    });
    resolve(html);
  })
  // console.log(html);
}
// renderTemplate();


// 6.0 定时每天5时20分13秒发送邮件给女朋友
// 6.2 创建定时任务
// var j = schedule.scheduleJob('5 * * * * *', function(){
//   sendNodeMail();
//   console.log('邮件发送成功');
// });

// 5.0 发送邮件
async function sendNodeMail() {
  // HTML 页面内容,通过await等待模板引擎渲染完毕后再往下走
  const html = await renderTemplate();
  // console.log(html);
  // 使用默认SMTP传输，创建可重用邮箱对象
  let transporter = nodemailer.createTransport({
      host: "smtp.qq.com",
      port: 465,
      secure: true, // 开启加密协议，需要使用 465 端口号
      auth: {
          user: "kuangsixiang@qq.com", // 用户名
          pass: "cwhffeqljcfebgec" // 客户端授权密码
      }
  });

  // 设置电子邮件数据
  let mailOptions = {
      from: '"帅气的小哥哥" <kuangsixiang@qq.com>', // 发件人邮箱
      to: "kuangsixiang@163.com", // 收件人列表
      subject: "love-email", // 标题
      html: html // html 内容
  };

  transporter.sendMail(mailOptions, (error, info = {}) => {
      if (error) {
          console.log(error);
          sendNodeMail(); //再次发送
      }
      console.log("邮件发送成功", info.messageId);
      console.log("静等下一次发送");
  });
}
sendNodeMail();