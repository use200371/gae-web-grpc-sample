import express from 'express';
import * as grpc from 'grpc';
import * as hello_grpc_pb from './proto/helloworld_grpc_pb';
import * as hello_pb from './proto/helloworld_pb';
import path from 'path';

const grpcWebMiddleware = require('grpc-web-middleware')

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
            grpcreq.setName('Hi! Request Data Name.');
            
            const test = await client.sayHello(grpcreq,  (error, result) => {
                if (error) 
                {
                    console.log('Error: ', error);
                }
                else 
                {
                    console.log(result.toObject());
                    console.log(JSON.stringify(result.toObject()));
                    const ret = new Buffer(JSON.stringify(result.toObject())).toString("base64");
                    //const ret =  result.toObject();
                    //const ret = Buffer.from(result.toObject()).toString('base64')
                    //res.json(ret);
                    res.status(200).send(ret);
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

        //const test = new InProxy(client);
        app.use(grpcWebMiddleware('http://127.0.0.1:8080'))

        app.use(express.static(path.join(__dirname, '../dist')));

        console.log('http://localhost:' + HTTP_PORT + " browser access!");
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

})();