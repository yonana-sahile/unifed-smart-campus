# Use Node 20 LTS
FROM node:20-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (this will now correctly install @vladmandic/face-api)
RUN npm install

# Copy the rest of the project
COPY . .

# Expose the development server port
EXPOSE 5173

# Run the development server with host exposure for Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
