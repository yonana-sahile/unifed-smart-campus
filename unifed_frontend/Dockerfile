# Use official Node image
FROM node:18-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project
COPY . .

# Build the app
RUN npm run build

# Expose port 5173
EXPOSE 5173

# Serve the app with Vite preview (or dev mode)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
