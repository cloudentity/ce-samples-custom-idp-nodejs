FROM node:16.14.2

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install -g npm@8.19.2

# Bundle app source
COPY . .

EXPOSE 4001
CMD [ "npm", "start" ]
