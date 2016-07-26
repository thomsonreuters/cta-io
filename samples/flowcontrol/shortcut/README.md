Shortcut sample
===============

This is a very basic flowcontrol application sample that illustrate how to use cta-io brick.

The app receives data from an external service 'Publisher' and produce them back to an external service 'Subscriber'

In order to communicate with external services, it uses cta-messaging tool as a dependency of cta-io brick

First, run the flowcontrol app

````javascript
node index;
````

You should see that both Receiver & Sender Bricks are initialized. Also, the Receiver Brick is waiting for messages in a queue 'input.queue'

Then, run the subscriber

````javascript
node subscriber;
````

You should see that it is waiting for messages in a queue 'output.queue'

Finally, run the publisher

````javascript
node publisher;
````

You should see that it is publishing some messages (date time) in the queue 'input.queue'

The flowcontrol app, receives those messages via the Receiver Brick and publish them in the flowcontrol channel

The Sender Brick receives the published message from the flowcontrol channel and produce them back into the queue 'output.queue'

The subscriber receives those messages from the flowcontrol app

In this basic sample, we just produce what we receive, that's why we call it shortcut
