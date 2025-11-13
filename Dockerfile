# Stage 1: Use a lean, official Node.js base image
FROM node:20-alpine AS build

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./
# Install dependencies needed for production
RUN npm install --omit=dev

# Copy the rest of the application code
COPY . .

# The port your Express server listens on (3000)
EXPOSE 3000

# The command to run the application when the container starts
CMD [ "node", "server.js" ]