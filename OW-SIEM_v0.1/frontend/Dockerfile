# Use an official Node runtime as a parent image
FROM node:20

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Set the environment variable to use the legacy OpenSSL provider
ENV NODE_OPTIONS=--openssl-legacy-provider

# Install dependencies
RUN npm install

# Install react-router-dom to be sure
RUN npm install react-router-dom

# Copy the rest of the application code
COPY . .

# Build the app
RUN npm run build

# Serve the app using serve
RUN npm install -g serve
CMD ["serve", "-s", "build"]

# Expose the port the app runs on
EXPOSE 3000

CMD ["npm", "start"]
