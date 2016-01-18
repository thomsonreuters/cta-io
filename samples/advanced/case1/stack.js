const amqp = require('amqplib/callback_api');

amqp.connect('amqp://localhost', function(connErr, conn) {
  if (connErr) {
    console.error(connErr);
  } else {
    conn.createChannel(function(chErr, ch) {
      if (chErr) {
        console.error(chErr);
      } else {
        ch.assertQueue('test', {durable: true});
        ch.prefetch(1);
        console.log('Waiting for messages in queue');
        ch.consume('test', function(msg) {
          const json = JSON.parse(msg.content.toString());
          console.log('Consumed message:', json);
          ch.ack(msg);
        }, {noAck: false});
      }
    });
  }
});
