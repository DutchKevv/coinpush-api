# Create image based on the official Node 6 image from dockerhub
FROM node:8

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app/server-old
RUN mkdir -p /usr/src/app/shared

# Install shared dependecies
# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app/shared
COPY /shared/package.json /usr/src/app/shared
RUN npm install

WORKDIR /usr/src/app/server-old
COPY /server/package.json /usr/src/app/server-old
RUN npm install

# Get all the code needed to run the app
COPY /server /usr/src/app/server-old
COPY /shared /usr/src/app/shared

# Expose the port the app runs in
EXPOSE 3000

# Serve the app
CMD ["npm", "start"]