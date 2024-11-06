# Use the official Node.js image as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and install dependencies (if needed)
COPY package*.json ./
RUN npm install

# This image will only run code passed in through a mounted volume
CMD [ "node", "/usr/src/app/userCode.js" ]
