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
app.use(express.static('public'));
app.engine('hbs', hbs.express4());
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.get('/', (req, res) => {
  return res.render('index');
});

const WID_REQUEST_URL = 'http://universe.walkrgame.com/api/v1/rewards/bind_referral_reward';

const ERROR_MESSAGES = {
  1: 'WID를 찾을 수 없습니다. 다시 확인해주세요.',
  2: '친구의 WID를 찾을 수 없습니다. 다시 확인해주세요.',
  3: '해당 보상은 다른 계정에서 가져갔습니다.',
  4: '친구가 로그인한지 48시간이 지났습니다.',
  5: '본인에 의해 만들어진 리워드는 확인하실 수 없습니다.',
  6: '시간당 5 리워드만 획득할 수 있습니다. 잠시 후 다시 방문하세요.'
};

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
    let alreadyPushedWorkWid = {};
    console.log(`wid ${wid} request. target wids: ${targetWids}`);
    targetWidArray.forEach((targetWid)=>{      
      if(targetWid !== '' && targetWid.length === 11 && !alreadyPushedWorkWid.hasOwnProperty(targetWid)){
        alreadyPushedWorkWid[targetWid] = targetWid;
        tasks.push(function(next){
          console.log(alreadyPushedWorkWid);
          return request.post(WID_REQUEST_URL, {form: {wid: wid, target_wid:targetWid}}, (err, httpResponse, body) => {
            if(err){
              results.push({
                type: 'ERROR',
                message: err.message
              });
            }else{
              try{
                let resultJSON = JSON.parse(body);
                let message = '';
                if(resultJSON.success){
                  message = '성공';
                }else{
                  if(ERROR_MESSAGES[resultJSON.error_type]){
                    message = ERROR_MESSAGES[resultJSON.error_type];
                  }else{
                    console.error(`wid: ${wid} -> ${targetWid} error. ${JSON.stringify(resultJSON)}`);
                    message = '알 수 없는 에러가 발생했습니다.';
                  }
                }

                results.push({
                  targetWid: targetWid,
                  message: message
                });
              }catch(e){
                console.log(e);
                results.push(body);
              }
            }
            return next(err);
          });
        });
      }
    });

    console.log(`${wid} task list:${tasks.length}`);
    return async.parallelLimit(tasks, 10, () => {
        return res.render('result', {
          requestCount: tasks.length,
          results: results
        });
    });

  }

  return res.render('error', {});
});


app.listen(33333);
console.log('server start.');
