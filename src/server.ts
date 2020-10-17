import express from 'express';
import * as grpc from 'grpc';
import { ExpressionStatement } from 'typescript';
import * as hello_grpc_pb from './proto/helloworld_grpc_pb';
import * as hello_pb from './proto/helloworld_pb';

class HelloService implements hello_grpc_pb.IGreeterServer 
{
    sayHello(
        call: grpc.ServerUnaryCall<hello_pb.HelloRequest>,
        callback: grpc.sendUnaryData<hello_pb.HelloReply>,
    ) 
    {
        const response = new hello_pb.HelloReply();
        response.setMessage(call.request.getName() + '!!Hello');
        callback(null, response);
    }
}

(() => {

    const app:express.Express = express();

    

    const server = new grpc.Server();
    server.bind(
        '0.0.0.0:8080',
        grpc.ServerCredentials.createInsecure(),
    );

    server.addService(
        hello_grpc_pb.GreeterService,
        new HelloService(),
    );

    server.start();

})();