# Build upon alpine container image
FROM alpine
# Add ca-certificates package to container image but don't cache the entire index of packages
RUN apk add --no-cache ca-certificates
# Copies built linux executable into the container
COPY . . 
# Listen to port 443 when it runs
EXPOSE 8001
# The program for Docker to execute when the container runs. 
ENTRYPOINT ["/authentication"]