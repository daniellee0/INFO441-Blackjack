docker rm -f blackjackmysql

docker rmi -f donloby/blackjackmysql:latest

docker pull donloby/blackjackmysql

export MYSQL_ROOT_PASSWORD="password" 


docker run -td \
-p 3306:3306 \
--name blackjackmysql \
-e MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD \
-e MYSQL_DATABASE=blackjackmysqldb \
donloby/blackjackmysql

exit
