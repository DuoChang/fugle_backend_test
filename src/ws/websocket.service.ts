// import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
// import { ConfigService } from '@nestjs/config';
// import * as dotenv from 'dotenv'
// import * as WebSocket from "ws";
// const WebSocketServer = require('ws').Server;
// const server = require('http').createServer();
// const wss = new WebSocketServer({ server: server });

// wss.on('connection', (ws, req) => {

//   ws.on('message', (data) => {
//       console.log('data: ' + data);
//       const json = JSON.parse(data);
//       const request = json.request;
//       const message = json.message;
//       const channel = json.channel;

//       switch (request) {
//           case 'PUBLISH':
//               pubSubManager.publish(ws, channel, message);
//               break;
//           case 'SUBSCRIBE':
//               pubSubManager.subscribe(ws, channel);
//               break;
//       }
//   });
//   ws.on('close', () => {
//       console.log('Stopping client connection.');
//   });
// });

// @Injectable()
// export class WebSocketService {

//   constructor (
    
//   ) {}
// }
