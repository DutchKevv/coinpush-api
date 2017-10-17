# Create image based on the official Node 6 image from dockerhub
FROM node:8

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app/server-broker
RUN mkdir -p /usr/src/app/shared

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app/server-broker

# Copy dependency definitions
COPY /server-broker/package.json /usr/src/app/server-broker

# Install dependecies
RUN npm install

# Get all the code needed to run the app
COPY /server-broker /usr/src/app/server-broker
COPY /shared/ /usr/src/app/shared

# Expose the port the app runs in
EXPOSE 3006

# Serve the app
CMD ["npm", "start"]