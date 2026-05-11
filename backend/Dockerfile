FROM node:16
WORKDIR /app
COPY package*.json ./
COPY .npmrc ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
