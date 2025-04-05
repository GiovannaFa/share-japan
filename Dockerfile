FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

# Install nodemon globally
RUN npm install -g nodemon

COPY . .

EXPOSE 3005

# Use nodemon to run the app
CMD ["nodemon", "src/index.js"]
