# Create image based on the official Node 6 image from dockerhub
FROM node:8

# Create a directory where our app will be placed
RUN mkdir -p /usr/src/app/server-user
RUN mkdir -p /usr/src/app/shared

# Change directory so that our commands run inside this new directory
WORKDIR /usr/src/app/server-user

# Copy dependency definitions
COPY /server-user/package.json /usr/src/app/server-user

# Install dependecies
RUN npm install

# Get all the code needed to run the app
COPY /server-user /usr/src/app/server-user
COPY /shared /usr/src/app/shared

# Expose the port the app runs in
EXPOSE 3008

# Serve the app
CMD ["npm", "start"]