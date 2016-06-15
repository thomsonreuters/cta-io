# IO Brick
-----------

First refer to cta-brick and cta-flowcontrol repositories to familiarize yourself with those concepts.

Io Brick can be easily injected into a flowcontrol using a configuration

````javascript
{
  bricks: [
    {
      name: 'Receiver',
      module: 'cta-io',
      properties: {                
        providerName: 'rabbitmq',
        parameters: {          
          url: 'amqp://localhost',
          inputQueue: 'inpout.queue',          
        },
      },
    ...
````

Properties:
* providerName: the name of the chosen provider. See supported providers in [IO Module](/lib/io/README.md)
* parameters.inputQueue: is the name of the queue where to read from as soon as the application is initialized.
  Read methods can be "subscribe" (default) or "consume". Refer to [IO Module](/lib/io/README.md) doc for these methods
  Received messages are published in the channel according to the publish configuration.
* parameters.inputMethod: "subscribe" (default) or "consume"
* parameters.outputQueue: is the name of the default output queue where to write to
* parameters.url: is the server's url of the chosen provider

You can see a [basic working sample](../samples/README.md) in /samples/flowcontrol