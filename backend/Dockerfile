# Use a lightweight Node image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the API port
EXPOSE 5000

# Run the dev script (starts nodemon)
CMD ["npm", "run", "dev"]