"use strict";

const Sqr = require('../lib/index.js');
const main = [{
  method: 'produce'
},{
  method: 'consume'
}, {
  method: 'publish'
}, {
  method: 'subscribe'
}];

module.exports = function(){

  main.forEach(function(e){
    it(e.method, function (done) {
      let sqr = new Sqr(this.provider);
      sqr[e.method](this.id)
        .then(function(data){
          console.log(data,'\n');
          done();
        }, function(err){
          done(err);
        });
    });
  });

};