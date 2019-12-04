# Build upon nginx container image
FROM nginx
# Use modified default.conf file
ADD  default.conf /etc/nginx/conf.d/default.conf
# Copy web site files into the container at the html directory
COPY .  /usr/share/nginx/html
