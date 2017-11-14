# cta-io [ ![build status](https://git.sami.int.thomsonreuters.com/compass/cta-io/badges/master/build.svg)](https://git.sami.int.thomsonreuters.com/compass/cta-io/commits/master) [![coverage report](https://git.sami.int.thomsonreuters.com/compass/cta-io/badges/master/coverage.svg)](https://git.sami.int.thomsonreuters.com/compass/cta-io/commits/master)

I/O Modules for Compass Test Automation, One of Libraries in CTA-OSS Framework

## General Overview

### Overview

This **I/O** (Input / Output) Module _provides communications_ between **CTA-OSS Framework** and **outsides services** via **messaging**.

## Guidelines

We aim to give you brief guidelines here.

1. [Usage](#1-usage)
1. [Input / Output](#2-input-output)
1. [Contracts](#3-contracts)

### 1. Usage

**cta-io** extends **Brick** (_cta-brick_). In order to use it, we need to provide a **configuration**. **cta-io** depends on **cta-messaging** which provides _messaging as a tool_.

```javascript
// a full sample code:
const config = {
  tools: [{
    name: 'sample.messaging',
    module: 'cta-messaging',
    properties: {
      provider: 'rabbitmq',
      parameters: {
        url: 'amqp://localhost?heartbeat=60',
      },
    },
  }],
  bricks: [{
    name: 'Receiver',
    module: 'cta-io',
    dependencies: {
      messaging: 'sample.messaging',
    },
    properties: {
      input: {
        queue: 'input.queue',
      },
    },
    publish: [{
      topic: 'sample.topics',
      data: [{}],
    }],
  }, {
    name: 'Sender',
    module: 'cta-io',
    dependencies: {
      messaging: 'sample.messaging',
    },
    properties: {},
    subscribe: [{
      topic: 'sample.topics',
      data: [{}],
    }],
  }],
};
```

#### Declaring cta-messaging as cta-io's dependencies

```javascript
const config = {
  tools: [{
    name: 'sample.messaging',
    module: 'cta-messaging',
    properties: {
      provider: 'rabbitmq',
      parameters: {
        url: 'amqp://localhost?heartbeat=60',
      },
    },
  }],
  ...
};
```

It declares a tool _named_ **"sample.messaging"** using **cta-messaging** module with _specified properties_.

#### Declaring Bricks as cta-io

```javascript
const config = {
  ...
  bricks: [{
    name: 'Receiver',
    module: 'cta-io',
    dependencies: {
      messaging: 'sample.messaging',
    },
    properties: {
      input: {
        queue: 'input.queue',
      },
    },
    publish: [{
      topic: 'sample.topics',
      data: [{}],
    }],
  }, {
    name: 'Sender',
    module: 'cta-io',
    dependencies: {
      messaging: 'sample.messaging',
    },
    properties: {},
    subscribe: [{
      topic: 'sample.topics',
      data: [{}],
    }],
  }],
};
```

It declares _two_ **bricks** named **"Receiver"** and **"Sender"** using **cta-io** module with **dependencies.messaging** named **"sample.messaging"**.

* **"Receiver"** Brick using **cta-io** module

```javascript
const config = {
  ...
  bricks: [{
    name: 'Receiver',
    module: 'cta-io',
    dependencies: {
      messaging: 'sample.messaging',
    },
    properties: {
      input: {
        queue: 'input.queue',
      },
    },
    publish: [{
      topic: 'sample.topics',
      data: [{}],
    }],
  },
  ...
  ],
};
```

This **"Receiver"** Brick _subscribes_ **"input.queue"** queue via **"sample.messaging"** and _publish_ a content on **"sample.topics"** topic.

* **"Sender"** Brick using **cta-io** module

```javascript
const config = {
  ...
  bricks: [
  ...
  {
    name: 'Sender',
    module: 'cta-io',
    dependencies: {
      messaging: 'sample.messaging',
    },
    properties: {},
    subscribe: [{
      topic: 'sample.topics',
      data: [{}],
    }],
  }],
};
```

This **"Sender"** Brick _subscribes_ **"sample.topics"** topic and _processes_ a content according to the **_received_ payload** via **"sample.messaging"**.

[back to top](#guidelines)

### 2. Input / Output

In **configuration**, **cta-io** uses **properties** _to manipulate_ the content as **input** / **output**.

* **properties.input**

```javascript
const config = {
  ...
  bricks: [{
    ...
    properties: {
      input: {
        queue: 'input.queue',
        topic: 'input.topic',
      },
    },
    ...
  }],
};
```

The **properties.input** has _two_ fields, **queue** and **topic**. They define the **name** of **queue**/**topic** which any content will _be consumed from_ as the **input**.

* **properties.output**

```javascript
const config = {
  ...
  bricks: [{
    ...
    properties: {
      output: {
        queue: 'output.queue',
        topic: 'output.topic',
      },
    },
    ...
  }],
};
```

The **properties.output** has _two_ fields, **queue** and **topic**. They define the **name** of **queue**/**topic** which any content will _be published to_ as the **output**.

[back to top](#guidelines)

### 3. Contracts

| nature.type | nature.quality | payload | description
| --- | --- | --- | ---
| message | produce | { status: 'ok' } | produce message { status: 'ok' } on **default** output queue
| message | produce | { queue: 'sample', message: { status: 'ok' }} | produce _message_ on **custom** queue: 'sample'
| message | consume | { status: 'ok' } |
| message | get | { status: 'ok' } |
| message | publish | { status: 'ok' } | publish message { status: 'ok' } on **default** exchange and **default** output topic
| message | publish | { exchange: 'sample.exchange', topic: 'sample.topic', message: { status: 'ok' }} | publish message { status: 'ok' } on **custom** exchange 'sample.exchange' and **custom** topic 'sample.topic'
| message | subscribe | { topic: 'sample.topic' } | subscribe to messages on **custom** topic 'sample.topic'
| message | acknowledge | { id: '123' } | acknowledge consumed message with id '123'

[back to top](#guidelines)

------

## To Do
