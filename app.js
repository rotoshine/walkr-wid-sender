'use strict';
const hbs = require('express-hbs');
const async = require('async');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
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
    let wid = body.wid;
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
            results.push(body);
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


app.listen(160412);
