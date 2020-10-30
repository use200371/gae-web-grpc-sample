import {HelloRequest, HelloReply} from './proto/helloworld_pb.js';
import {GreeterClient} from './proto/helloworld_grpc_web_pb.js';

var client = new GreeterClient('http://' + window.location.hostname + ':' + window.location.port, null, null);

const enableDevTools = window.__GRPCWEB_DEVTOOLS__ || (() => {});

enableDevTools([
  client,
]);

// simple unary call
var request = new HelloRequest();
request.setName('World');

client.sayHello(request, {}, (err, response) => {
if (err) {
 console.log(`Unexpected error for sayHello: code = ${err.code}` +
             `, message = "${err.message}"`);
} else {
 console.log(response.getMessage());
}
});
