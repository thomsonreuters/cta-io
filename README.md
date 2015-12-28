# SQR (Send-Queue-Receive)

Send, receive & queue brick for CTA project

## How to use it

### Produce a job

```javascript
// see samples/produce.js
const SqrLib = require('../lib/');
const provider = new SqrLib.rabbitMQProvider();
const sqr = new SqrLib(provider);

sqr.produce({
  queue: 'test',
  json: {
    job: 'run command',
    cmd: 'ls',
  },
}).then(function() {
  console.log('Produced new job');
}, function(err) {
  console.error('Can\'t produce new job: ', err);
});
```

### Consume a job

```javascript
// see samples/consume.js
const q = require('q');
const SqrLib = require('../lib/');
const provider = new SqrLib.rabbitMQProvider();
const sqr = new SqrLib(provider);

function cb(json) {
  const deferred = q.defer();
  console.log('Received new job: ', json);
  // adding timeout to simulate job running
  setTimeout(function() {
    console.log('Job done');
    deferred.resolve();
  }, 2000);
  return deferred.promise;
}

sqr.consume({queue: 'test', cb: cb})
  .then(function() {
    console.log('Consumed new job');
  }, function(err) {
    console.error(err);
  });
```