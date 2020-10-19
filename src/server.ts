import express from 'express';
import * as grpc from 'grpc';
import * as hello_grpc_pb from './proto/helloworld_grpc_pb';
import * as hello_pb from './proto/helloworld_pb';
import path from 'path';
import morgan from 'morgan';

const grpcExpress = require('grpc-express');

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

    const client = new hello_grpc_pb.GreeterClient(
        '127.0.0.1:8080',
        grpc.credentials.createInsecure(),
    );

    app.listen(8000, async ()=> {
        console.log(__dirname);
        app.use(express.static(path.join(__dirname, '../dist')));
        app.use(morgan('combined'));

        app.use(grpcExpress(client));
        console.log('OK');
    });

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

    console.log('gRPC Server Start')

//     // 8080番ポートで待ちうける
// app.listen(8080, () => {
//     console.log('Running at Port 8080...');
//   });
  
//   // 静的ファイルのルーティング
//   app.use(express.static(path.join(__dirname, 'public')));
  
//   // その他のリクエストに対する404エラー
//   app.use((req, res) => {
//     res.sendStatus(404);
//   });
  

})();