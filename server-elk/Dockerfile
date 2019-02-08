FROM sebp/elk:latest

ENV LS_HOME /opt/logstash
WORKDIR ${LS_HOME}

COPY /server-elk/plugins /src

RUN gosu logstash /opt/bin/logstash-plugin install /src/logstash-input-mongodb-0.4.1.gem &&\
    gosu logstash mkdir /opt/logstash-mongodb &&\
    gosu logstash /opt/bin/logstash -f config/input-mongodb-comments.conf