# cta-io flowcontrol implementation sample

## How it works
* api produces jobs in an input queue. Jobs consists of providing two numbers for arithmetic multiplication
* io consumes those jobs from the input queue and sends them to broker
* broker receives jobs and do the multiplication, then sends the results back to io
* io produces the result in an output queue
* ui consumes results from the output queue and displays them to the user

## How to use it

### start api

````javascript
node api // start api component to produce a job (restart to produce again)
````

### start ui

````javascript
node ui // start UI component to receive results
````

### start app

````javascript
node index
````




   