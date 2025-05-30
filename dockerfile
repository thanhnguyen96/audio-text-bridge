# Use an official Node.js runtime as a parent image
# Using Alpine Linux for a smaller image size
FROM node:22-alpine

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Copy patches directory if it exists (used by patch-package)
# If you use patch-package and have a 'patches' directory, ensure it's copied.
# If you don't have a 'patches' directory, this line can be omitted or will do nothing.
COPY patches ./patches/

# Install dependencies.
# This will now install all dependencies (including devDependencies like patch-package)
# because NODE_ENV is not yet set to 'production'.
# The `postinstall` script "patch-package" will run here.
RUN npm install

# Copy the rest of your application's source code
COPY . .

# Now set the Node environment to production for subsequent steps and the runtime environment.
ENV NODE_ENV=production

# Prune devDependencies after patches have been applied and all code is present.
# This removes packages like 'patch-package' itself from the final image.
RUN npm prune --production 

# Create directories for uploads and TTS output if they don't exist,
# and set ownership to the 'node' user.
# The application also attempts to create these, but doing it here ensures correct permissions.
# UPLOADS_DIR_NAME is "uploads"
# TTS_OUTPUT_DIR is "data/text-to-speech/tts-audio-output"
RUN mkdir -p uploads data/text-to-speech/tts-audio-output && \
    chown -R node:node uploads data

# Switch to the non-root 'node' user
USER node

# Expose the port the app runs on
# Your app uses process.env.PORT || 3000
EXPOSE 3000

# Define the command to run your app
CMD [ "npm", "start" ]
