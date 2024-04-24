FROM node:18-alpine

# Set the environment variable for VECHAIN_NODE with a default value
ENV VECHAIN_NODE=default_value

# Install dependencies that are not included in the base image
RUN apk update \
    && apk add --no-cache git curl ca-certificates unzip bash jq \
    && rm -rf /var/cache/apk/*

# Create and set the app directory as the working directory
RUN mkdir -p /app && chown node:node /app
WORKDIR /app

# Clone the repository containing your Node.js application into the app directory
RUN git clone https://github.com/vechainfoundation/remix-proxy.git .

# Install Yarn dependencies, ignoring scripts for security
RUN yarn --production --ignore-scripts

# Since `remix-proxy` does not have `ethers` as a dependency, we add it here
RUN yarn add ethers@5.x

# Copy the start-rpc-proxy.sh script into the container at the working directory
COPY --chown=node:node ./scripts/start-rpc-proxy.sh .

# Make the script executable
RUN chmod +x ./start-rpc-proxy.sh

# Expose the port that your app will run on
EXPOSE 8545

# Switch to the user 'node' for security purposes
USER node

# When the container starts, run the start-rpc-proxy.sh script
ENTRYPOINT ["./start-rpc-proxy.sh"]
