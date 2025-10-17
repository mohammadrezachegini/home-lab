# Use nginx:alpine-slim as base Docker Image
FROM nginx:alpine-slim

# Custom Labels
LABEL maintainer="Reza Chegini"  
LABEL version="1.0"
LABEL description="A simple Nginx Application"
# OCI Labels
LABEL org.opencontainers.image.authors="Reza Chegini"
LABEL org.opencontainers.image.title="Nginx Alpine Slim Application"
LABEL org.opencontainers.image.description="A lightweight Nginx application built on Alpine."
LABEL org.opencontainers.image.version="1.0"
LABEL org.opencontainers.image.revision="1234567890abcdef" 
LABEL org.opencontainers.image.created="2024-11-04T08:30:00Z"
LABEL org.opencontainers.image.url="https://github.com/mohammadrezachegini/Docker-Projects"
LABEL org.opencontainers.image.source="https://github.com/mohammadrezachegini/Docker-Projects"
LABEL org.opencontainers.image.documentation="https://github.com/mohammadrezachegini/Docker-Projects"
LABEL org.opencontainers.image.vendor="Reza Chegini"
LABEL org.opencontainers.image.licenses="Apache-2.0"

# Using COPY to copy a local file
COPY index.html /usr/share/nginx/html