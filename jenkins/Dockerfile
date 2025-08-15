FROM jenkins/jenkins:jdk21

USER root

RUN apt-get update && apt-get install -y curl unzip && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o /tmp/awscliv2.zip \
 && unzip /tmp/awscliv2.zip -d /tmp \
 && /tmp/aws/install \
 && rm -rf /tmp/aws /tmp/awscliv2.zip

RUN curl -fsSL -o /usr/local/bin/jq "https://github.com/jqlang/jq/releases/download/jq-1.8.1/jq-linux-arm64" \
 && chmod +x /usr/local/bin/jq

ENV NVM_DIR=/usr/local/nvm
ENV NODE_VERSION=20

RUN mkdir -p "$NVM_DIR" \
 && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash \
 && . "$NVM_DIR/nvm.sh" \
 && nvm install "$NODE_VERSION" \
 && nvm alias default "$NODE_VERSION" \
 && nvm use default \
 && NODE_PATH="$(. "$NVM_DIR/nvm.sh" && nvm which default)" \
 && ln -sf "$NODE_PATH" /usr/local/bin/node \
 && ln -sf "$(dirname "$NODE_PATH")/npm" /usr/local/bin/npm \
 && ln -sf "$(dirname "$NODE_PATH")/npx" /usr/local/bin/npx

USER jenkins