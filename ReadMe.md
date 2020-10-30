# gRPC-Web All TypeScript Sample For App Engine SE

## 概要

GAE上にてgRPC-Webを用いてサーバーとの通信を行う為のサンプルです。

## 注意事項

VSCodeのシェルが「bash」を想定しています。

gitがインストールされている場合は、「git bash」をVSCodeに設定します。

## インストールとビルド

カレントディレクトリを移動

```
cd gae-web-grpc-sample
```

[gRPC-Web Release](https://github.com/grpc/grpc-web/releases)から「protoc-gen-grpc-web-xxx-windows-x86_64.exe」をダウンロードして「protoc-gen-grpc-web.exe」に名前を変更してカレントディレクトリに配置して下さい。sd

npxコマンドがインストールされていない場合はグローバルへ下記のコマンドでインストールします。

```
npm i -g npx
```

リポジトリをクローン後に必要なパッケージをインストールします。

```
npm install
```

protoファイルの生成、grpc-web(クライアント側)のビルド

```
npm build
```