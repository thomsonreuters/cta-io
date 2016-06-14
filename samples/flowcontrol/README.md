# cta-io flowcontrol implementation sample

## How it works

* api produces jobs in an input queue. Jobs consists of providing two numbers for arithmetic multiplication
* io consumes those jobs from the input queue and sends them to broker
* broker receives jobs and do the multiplication, then sends the results back to io
* io produces the result in an output queue
* ui consumes results from the output queue and displays them to the user
* if io lose rmq connection and can't produce results it store them into silo
* when rmq connection is back, io produce recovered results to a different queue

## How to use it

````javascript
node ui // receive results
node deferred // receive deferred results
node index // main app
node api // produce a job (restart to produce again)
````

You should see multiplication result in ui console

Produce a new job and quickly stop rabbitMQ (you have 5s to do it since a job take 5s)

You should see produce errors in index console

Start rabbitMQ, and wait 30s

You should see last job result in deferred console


   