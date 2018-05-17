FROM jenkins/jenkins:lts

USER root
RUN mkdir /var/log/jenkins
RUN mkdir /var/cache/jenkins
RUN chown -R jenkins:jenkins /var/log/jenkins
RUN chown -R jenkins:jenkins /var/cache/jenkins
USER jenkins
ENV JAVA_OPTS="-Xmx8192m"

COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN /usr/local/bin/install-plugins.sh < /usr/share/jenkins/ref/plugins.txt

USER root

ENV SDK_URL="https://dl.google.com/android/repository/sdk-tools-linux-3859397.zip" \
    ANDROID_HOME="/usr/src/android-sdk" \
    ANDROID_VERSION=27 \
    ANDROID_BUILD_TOOLS_VERSION=27.0.3 \
    GRADLE_HOME=/gradle/gradle-4.7 \
    PATH=$PATH:/gradle/gradle-4.7/bin

# (temp login with username password)
RUN apt-get update && apt-get install sshpass

# nodejs
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - && apt-get install -yq nodejs build-essential

# gradle
RUN wget https://services.gradle.org/distributions/gradle-4.7-bin.zip && unzip -d /gradle gradle-4.7-bin.zip

# Download Android SDK
# RUN chmod +x "/usr/local/"
RUN mkdir -p "$ANDROID_HOME" \
    mkdir "$ANDROID_HOME" .android \
    && cd "$ANDROID_HOME" \
    && curl -o sdk.zip $SDK_URL \
    && unzip sdk.zip \
    && rm sdk.zip \
    && yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses

# Install Android Build Tool and Libraries
RUN $ANDROID_HOME/tools/bin/sdkmanager --update
RUN $ANDROID_HOME/tools/bin/sdkmanager "build-tools;${ANDROID_BUILD_TOOLS_VERSION}" \
    "platforms;android-${ANDROID_VERSION}" \
    "platform-tools"

# docker compose
RUN curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/local/bin/docker-compose
RUN chmod +x /usr/local/bin/docker-compose