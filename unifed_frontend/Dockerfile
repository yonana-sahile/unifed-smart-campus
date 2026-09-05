# Use Node 20 LTS (required for Vite 8 + rolldown compatibility)
FROM node:20-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project
COPY . .

# Build the app (uses vite build directly, no tsc)
RUN npm run build

# Expose the development server port
EXPOSE 5173

# Run the preview server (or switch to dev for hot‑reload)
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
