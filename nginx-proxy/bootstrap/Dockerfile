FROM amazonlinux:2

RUN yum update -y && yum install -y awscli

COPY bootstrap.sh /opt/bootstrap.sh
RUN chmod +x /opt/bootstrap.sh

CMD ["/bin/bash", "/opt/bootstrap.sh"]