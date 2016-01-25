The producer produces a message {key: i} each second, i=1..50

The consumer consumes those messages and publishes results

The subscriber consume those results

Run those 3 commands in 3 independent consoles (one command in each console)

Console1
````javascript
node consumer.js
````

Console2
````javascript
node subscriber
````

Console3
````javascript
node producer.js
````

Restart your rabbitMQ server many times during the runtime to simulate server restarts
The 3 processes should survive to those restarts