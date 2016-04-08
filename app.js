'use strict';
const hbs = require('express-hbs');
const async = require('async');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');
const app = express();
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.engine('hbs', hbs.express4());
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.get('/', (req, res) => {
  return res.render('index');
});

const WID_REQUEST_URL = 'http://universe.walkrgame.com/api/v1/rewards/bind_referral_reward';
app.post('/', (req, res) => {
  let body = req.body;

  if(body.wid && body.targetWids){
    const BLACK_LIST = [
      'LD7hfjPxjys',
      'gVTxzNDwEcz'
    ];

    let wid = body.wid;
    if(_.includes(BLACK_LIST, wid)){
      return res.render('error');
    }

    let targetWids = body.targetWids;
    let targetWidArray = targetWids.split('\r\n');
    let tasks = [];
    let results = [];
    targetWidArray.forEach((targetWid)=>{
      tasks.push(function(next){
        return request.post(WID_REQUEST_URL, {form: {wid: wid, target_wid:targetWid}}, function(err, httpResponse, body){
          if(err){
            results.push({
              type: 'ERROR',
              message: err.message
            });
          }else{
            try{
              let resultJSON = JSON.parse(body);
              if(resultJSON.success){
                resultJSON.push(`${targetWid} ===> 성공`);
              }else{
                let errorType = resultJSON.error_type;
                if(errorType === 1){
                  resultJSON.push(`${targetWid} ===> WID를 찾을 수 없습니다. 다시 확인해주세요.`);
                }else if(errorType === 2){
                  resultJSON.push(`${targetWid} ===> 친구의 WID를 찾을 수 없습니다. 다시 확인해주세요.`);
                }else if(errorType === 3){
                  resultJSON.push(`${targetWid} ===> 해당 보상은 다른 계정에서 가져갔습니다.`);
                }else if(errorType === 4){
                  resultJSON.push(`${targetWid} ===> 친구가 로그인한지 48시간이 지났습니다.`);
                }else if(errorType === 5){
                  resultJSON.push(`${targetWid} ===> 본인에 의해 만들어진 리워드는 확인하실 수 없습니다.`);
                }else{
                  resultJSON.push(`${targetWid} ===> 알 수 없는 에러가 발생했습니다.`);
                }
              }
              switch(resultJSON.errorType)
            }catch(e){
              results.push(body);
            }
          }
          return next(err);
        });
      });
    });

    console.log(`task list:${tasks.length}`);
    return async.parallel(tasks, () => {
        return res.render('result', { results: results });
    });

  }

  return res.render('error', {});
});


app.listen(33333);
