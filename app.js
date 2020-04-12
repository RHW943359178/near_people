const express = require('express');
const formidable = require('formidable');
const fs = require('fs');
const path = require('path');
const db = require('./dbTools');
const https = require('https');

// const options = {
//   key: fs.readFileSync('./1530632509237.key'),
//   cert: fs.readFileSync('./1530632509237.pem')
// };

//  创建服务
let app = express();

// let server = https.createServer(options, app);

//  创建路由
let router = express.Router();

let heros = [
  // {name: '紫发少年', img: 'imgs/1.jpg'},
  // {name: '黑发美女', img: 'imgs/2.jpg'},
  // {name: '超人', img: 'imgs/3.jpg'},
]

//  处理图片（暴露public）
app.use(express.static('./public'));

//  注册引擎模板
app.engine('.html', require('express-art-template'));

//  配置不同环境
app.set('view option', {
  debug: process.env.NODE_ENV !== 'production'
})

router.get('/list', (req, res, next) => {
  if (!req.headers.cookie) {
    return res.json({msg: 'bye, 没记录'});
  }
  let location = req.headers.cookie.split('=')[1];
  location = location.split(',');
  let l = parseFloat(location[1]);
  let r = parseFloat(location[0]);

  //  从数据库中获取数据
  db.findNear('heros', {l, r}, (err, documents) => {
    if (err) return next(err);

    //  calculated
    res.render('list', {
      heros: documents //  es6: key与value同名时
    });
  });

})
.get('/', (req, res, next) => {
  res.render('index');
})
.post('/add', (req, res, next) => {
  //  解析文件，用包
  var form = new formidable.IncomingForm();

  //  修改上传目录
  form.uploadDir = path.join(__dirname, 'public', 'imgs');

  //  保持原有后缀名
  form.keepExtensions = true;

  //  解析
  form.parse(req, (err, fields, files) => {
    console.log(fields);  //  fields.nickname 获取昵称

                          //  路径：files.avatar.path
                          //  path.parse(路径).basename //  获取文件名
    console.log(files);

    let nickname = fields.nickname;
    let filename = path.parse(files.avatar.path).base;
    let location = fields.location.split(',');
    let longitude_l = location[1] - 0;
    let latitude_r = location[0] - 0;

    //  存储img. 网络能请求的路径   img/uploadxxx.js
    let img = 'imgs/' + filename;

    // heros.push({nickname, img});

    //  保存数据
    db.insert('heros', [{nickname, img, sp: {type: 'Point', coordinates: [longitude_l, latitude_r]}}], (err, result) => {
      if (err) return next(err);
      console.log(result);
      //  同步提交，浏览器等待页面显示
      res.setHeader('set-cookie', 'location=' + location)
      res.redirect('/list');
    });


  });

})
//  最后一条路由
.all('*', (req, res) => {
  res.send('地址错误，您去首页吧');
})
//  配置引擎
app.set('view engine', '.html');


//  挂载路由
app.use(router);

//  全局处理错误
app.use((err, req, res, next) => {
  console.log(err);
  res.send('<h1>亲爱的用户，您访问的页面，有事儿了,<a>去首页看看</a>')
})

//  监听
app.listen(8888, () => {
  console.log('服务启动在8888端口');
})