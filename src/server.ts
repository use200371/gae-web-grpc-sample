import express from 'express';
import * as grpc from 'grpc';
import * as hello_grpc_pb from './proto/helloworld_grpc_pb';
import * as hello_pb from './proto/helloworld_pb';
import path from 'path';
import morgan from 'morgan';

const grpcExpress = require('grpc-express');

const HTTP_PORT:Number = 9000;

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

const client = new hello_grpc_pb.GreeterClient(
    '127.0.0.1:8080',
    grpc.credentials.createInsecure(),
);

class InProxy
{
    private _unaryCalls:Map<String, String> = new Map();

    constructor(client:any)
    {
        [
            ...new Set(Object.keys(client.__proto__).filter(
                route => !client[route].requestStream && !client[route].responseStream
            ).map(route => client[route].path))
        ].filter(r => r).forEach(route => {
            const keys = this.routeToPathKeys(route);
            this._unaryCalls.set(keys.lower, keys.name);
            this._unaryCalls.set(keys.upper, keys.name);
        });

    }

    routeToPathKeys(route:any):any {
        const functionName = route.split('/').slice(-1)[0];
        return {
            upper: route.replace(functionName, this.toUpperCaseFirstLetter(functionName)),
            lower: route.replace(functionName, this.toLowerCaseFirstLetter(functionName)),
            name: this.toLowerCaseFirstLetter(functionName)
        };
    }
    
    toUpperCaseFirstLetter(string:String):String 
    {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    toLowerCaseFirstLetter(string:String):String
    {
        return string.charAt(0).toLowerCase() + string.slice(1);
    }    

    proxy(req:express.Request, res:express.Response, next:express.NextFunction)
    {
        console.log(req.path);

        if (!this._unaryCalls.has(req.path)) {
            next();
            return;
        }

    //if (this._unaryCalls.has(req.path)) this.proxyUnaryCall(req, res);
    // else if (this._serverStreamCalls.has(req.path))
    //   this.proxyServerStreamCall(req, res);
    // else next();

        (async ()=> {

            res.setHeader('Content-Type', 'application/grpc-web-text');

            const grpcreq = new hello_pb.HelloRequest();
            grpcreq.setName('Hello World');
            
            const test = await client.sayHello(grpcreq,  (error, result) => {
                if (error) 
                {
                    console.log('Error: ', error);
                }
                else 
                {
                    console.log(result.toObject());
                    //const ret =  result.toObject();
                    //const ret = Buffer.from(result.toObject()).toString('base64')
                    //res.json(ret);
                    res.status(200).send(result);
                    return;
                }
            });

            //res.status(200).send('test');

        })();
        
        //next();
    }
}

(() => {

    const app:express.Express = express();

    const client = new hello_grpc_pb.GreeterClient(
        '127.0.0.1:8080',
        grpc.credentials.createInsecure(),
    );

    app.listen(HTTP_PORT, async ()=> {
        console.log(__dirname);
        const test = new InProxy(client);
        app.use(test.proxy.bind(test));
        app.use(express.static(path.join(__dirname, '../dist')));
        app.use(morgan('combined'));

        //app.use(grpcExpress(client));
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