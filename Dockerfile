FROM hypriot/rpi-node:latest

RUN apt-get update && apt-get install -y --no-install-recommends \
	iputils-ping \
	&& rm -rf /var/lib/apt/lists/* \
	&& apt-get clean

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
RUN npm install

# Bundle app source
COPY . /usr/src/app

CMD [ "npm", "start" ]
