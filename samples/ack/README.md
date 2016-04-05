# ack implementation sample

Sample with a producer and two parallel workers

The producer produces 5 messages

One consumer rejects jobs and the other acknowledges them

## How to use it

Start the 3 processes in different consoles

````javascript
node reject_job
node ack_job
node producer
````