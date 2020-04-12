const MongoClient = require('mongodb').MongoClient;

//  mongodb链接地址
const url = 'mongodb://localhost:27017';

//  数据库名称
const dbName = 'near_people';

var obj = {};



//  增删改查，每次都需要拿连接，增删改查调用连接函数，获取对象
function _connect(callback) {
  MongoClient.connect(url, (err, client) => {
    if (err) throw err; //  连接异常
    //  获取db对象，再获取集合对象（操作数据）
    callback(client);
  });
}

//  初始化
_connect(client => {
  let c = client.db(dbName).collection('heros');
  c.createIndex({'sp': '2dsphere'}, () => {
    client.close();
  });
})

//  插入数据
obj.insert = (cname, arrDate, fn) => {
  _connect(client => {
    let c = client.db(dbName).collection(cname);
    c.insertMany(arrDate, (err, result) => {
      //  将数据和错误，交给外部处理
      //  关闭连接
      client.close();
      fn(err, result);
    });
  })
}

//  查询数据
obj.find = (cname, filter, fn) => {
  _connect(client => {
    let c = client.db(dbName).collection(cname);
    c.find(filter).toArray((err, docs) => {
      client.close();
      fn(err, docs);
    });
  });
}

//  更新
obj.update = (cname, filter, updated,fn) => {
  _connect(client => {
    let c = client.db(dbName).collection(cname);
    c.update(filter, {$set:updated}, (err, result) => {
      client.close();
      fn(err, result);
    });
  });
}

//  删除
obj.delete = (cname, filter, fn) => {
  _connect(client => {
    let c = client.db(dbName).collection(cname);
    c.deleteMany(filter, (err, result) => {
      client.close();
      fn(err, result);
    })
  })
}

obj.findNear = (cname, filter, fn) => {
  _connect(client => {
    let c = client.db(dbName).collection(cname);
    c.aggregate({
      $geoNear: {
        near: {type: 'Point', coordinates: [filter.l, filter.r]},
        distanceField: 'dist.calculated',
        spherical: true
      }
    }, (error, cursor) => {
      if (error) throw error;
      cursor.toArray((err, documents) => {
        client.close();
        fn(err, documents);
      })
    })
  });
}

module.exports = obj;