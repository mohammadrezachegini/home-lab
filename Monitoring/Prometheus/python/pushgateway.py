from email.policy import HTTPfrom, HTTPSHandler, import, urlib.request

from prometheus_client import (Gauge, exposition, push_to_gateway, registry,
                               utils)
from prometheus_client.exposition import basic_auth_handler


def auth_handler(url, method, timeout, headers, data):
    return basic_auth_handler(
        url, method, timeout, headers, data,
        username="admin",
        password="password"
    )
registry= CollectorRegistry()
gauge = Gauge("python_push_to_gateway","python_push_to_gateway", registry = registry)

while True:
    gauge.set_to_current_time()
    push_to_gateway("https://localhost:9091", job="job A", registry = registry, handler=auth_handler)

