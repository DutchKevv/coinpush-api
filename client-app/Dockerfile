FROM bringnow/android-sdk

# Set up environment variables
ENV ANDROID_HOME="/home/user/android-sdk-linux" \
    SDK_URL="https://dl.google.com/android/repository/sdk-tools-linux-3859397.zip" \
    GRADLE_URL="https://services.gradle.org/distributions/gradle-4.1-all.zip" \
    GRADLE_HOME="/home/user/gradle" 

# Install Gradle
WORKDIR /home/user
RUN wget $GRADLE_URL -O gradle.zip \
 && unzip gradle.zip \
 && mv gradle-4.1 gradle \
 && rm gradle.zip \
 && mkdir .gradle

RUN dpkg --add-architecture i386 && \
    apt-get -qq update && \ 
    apt-get -qq install -y wget curl maven ant libncurses5:i386 libstdc++6:i386 zlib1g:i386 

ENV PATH $PATH:/home/user/gradle/bin:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/$ANDROID_BUILD_TOOLS_VERSION:$ANT_HOME/bin:$MAVEN_HOME/bin:$GRADLE_HOME/bin

RUN npm i cordova -g

WORKDIR /usr/src/app/client-app
COPY /client-app .
