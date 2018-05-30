# Webinars

### Notice
Live demo coming soon

## Description
Host, view and record webinars. This is a server-side for webinars-client. 

Get the client application from here: https://github.com/maartshin/webinars-client.

## Deploying on local machine
1. Install Janus Gateway with websocket and post-processing included: https://github.com/meetecho/janus-gateway
2. Configure Janus Gateway to use secure websocket and generate certificates for ssl.
3. Install mongodb and run it.
4. Use "npm install" for downloading and installing dependencies for webinars project.
5. Configure .env file in webinars root folder.
6. Use "npm run grunt" for building webinars project.
7. Use "npm start" to start webinars project node server.

NB: Client application is also required.
