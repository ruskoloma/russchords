FROM jenkins/jenkins:jdk21

USER root

RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o /tmp/awscliv2.zip \
 && unzip /tmp/awscliv2.zip -d /tmp \
 && /tmp/aws/install \
 && rm -rf /tmp/aws /tmp/awscliv2.zip

RUN curl -fsSL -o /usr/local/bin/jq "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-arm64" \
 && chmod +x /usr/local/bin/jq

 USER jenkins