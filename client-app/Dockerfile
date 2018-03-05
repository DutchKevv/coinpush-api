FROM beevelop/cordova

WORKDIR /usr/src/app/client-app
COPY /client-app .

# FROM takitake/gradle-alpine

# ENV SDK_URL="https://dl.google.com/android/repository/sdk-tools-linux-3859397.zip" \
#     ANDROID_HOME="/usr/local/android-sdk" \
#     ANDROID_VERSION=27 \
#     ANDROID_BUILD_TOOLS_VERSION=27.0.3

# RUN mkdir -p ~/.android && touch ~/.android/repositories.cfg

# RUN apk update && \
#     apk add git curl nodejs bash libstdc++ && \
#     rm -rf /var/cache/apk/*

# # RUN apk --no-cache add ca-certificates wget
# # RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://raw.githubusercontent.com/sgerrand/alpine-pkg-glibc/master/sgerrand.rsa.pub
# # RUN wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.27-r0/glibc-2.27-r0.apk
# # RUN apk add glibc-2.27-r0.apk

# # Download Android SDK
# RUN mkdir "$ANDROID_HOME" .android \
#     && cd "$ANDROID_HOME" \
#     && curl -o sdk.zip $SDK_URL \
#     && unzip sdk.zip \
#     && rm sdk.zip \
#     && yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses

# # Install Android Build Tool and Libraries
# # RUN $ANDROID_HOME/tools/bin/sdkmanager --update
# RUN $ANDROID_HOME/tools/bin/sdkmanager "build-tools;${ANDROID_BUILD_TOOLS_VERSION}" "platforms;android-${ANDROID_VERSION}" "platform-tools"

# # RUN chmod 777 -R $ANDROID_HOME

# WORKDIR /usr/src/app/client-app
# COPY /client-app .
