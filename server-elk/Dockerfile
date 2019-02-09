FROM sebp/elk:latest

WORKDIR /opt/logstash

COPY logstash/plugins/mongodb.0.4.1.gem /etc/logstash/plugins/mongodb.0.4.1.gem

RUN /opt/logstash/bin/logstash-plugin install /etc/logstash/plugins/mongodb.0.4.1.gem