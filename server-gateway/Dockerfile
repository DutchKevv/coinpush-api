# Create image based on the official Node 6 image from dockerhub
FROM node:8

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app/server-gateway
RUN mkdir -p /usr/src/app/shared

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app/server-gateway

# Copy dependency definitions
COPY /server-gateway/package.json /usr/src/app/server-gateway

# Install dependecies
RUN npm install

# Get all the code needed to run the app
COPY /server-gateway /usr/src/app/server-gateway
COPY /shared /usr/src/app/shared

# Expose the port the app runs in
EXPOSE 3100

# Serve the app
CMD ["npm", "start"]