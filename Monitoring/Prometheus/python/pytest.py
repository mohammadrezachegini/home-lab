from prometheus_client import start_http_server, Summary, Counter, Gauge
import random
import time

REQUEST_TIME =  Summary("request_processing_second", "Time Spent processing a fucntion")
MY_COUNTER = Counter("my_counter","", ["name","age"] )
MY_GAUGE = Gauge("my_gauge", "")

req_counter = MY_COUNTER.labels(name="Reza", age="31")
@REQUEST_TIME.time()
@MY_COUNTER.labels(name="Reza", age="31").count_exceptions()
def process_request(t):
    MY_COUNTER.labels(name="Reza", age=31).inc(3)
    MY_COUNTER.labels(name="Reza", age="31").inc(5)
    MY_GAUGE.set(5)
    MY_GAUGE.inc(5)
    MY_GAUGE.dec(2)
    time.sleep(t)
if __name__== '__main__':
    start_http_server(8000)
    #while True:
    #    process_request(random.random())
    process_request(random.random())
    while True:
        A=1
    print("The end")
