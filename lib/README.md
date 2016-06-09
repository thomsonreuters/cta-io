# IO Brick
-----------

First refer to cta-brick and cta-flowcontrol repositories to familiarize yourself with those concepts.

Io Brick can be easily injected into a flowcontrol using a configuration

````javascript
{
  bricks: [
    {
      name: 'io',
      module: 'cta-io',
      properties: {
        inputQueue: 'inpout.queue',
        outputQueue: 'output.queue',
        provider: {
          name: 'rabbitmq',
          options: {
            url: 'amqp://localhost',
          },
        },
        start: {
          method: 'consume',
          params: {
            queue: 'inpout.queue',
            ack: 'auto',
          },
        },
      },
    ...
````

Properties:

* inputQueue: is the name of the default input queue where to read from if none is provided
* outputQueue: is the name of the default output queue where to write to if none is provided
* provider: is the configuration of the chosen provider, refer to provider's doc
* start: handles the name and parameters of the method to launch on application start up, basically it would be a read method, ie. consume or subscribe. See Io Module docs for more information about these methods

You can see a [basic working sample](../samples/README.md) in /samples/flowcontrol