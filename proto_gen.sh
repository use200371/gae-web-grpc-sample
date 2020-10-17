#/bin/sh

set -eu

PROTO_SRC=./proto
PROTO_DEST=./src/proto

mkdir -p ${PROTO_DEST}

PROTOC=$(npm bin)/../grpc-tools/bin
PROTOC_GEN_GRPC_WEB=

if [ "$(uname)" == 'Darwin' ]; then
  PROTOC=$PROTOC/protoc
  PROTOC_GEN_GRPC_WEB=$(pwd)/protoc-gen-grpc-web
else
  PROTOC=$PROTOC/protoc.exe
  PROTOC_GEN_GRPC_WEB=./protoc-gen-grpc-web.exe
fi

if [ ! -f $PROTOC_GEN_GRPC_WEB ]; then
  echo -e "Please program Download!\nhttps://github.com/grpc/grpc-web/releases"
  exit 1
fi

npx grpc_tools_node_protoc \
  --js_out=import_style=commonjs,binary:${PROTO_DEST} \
  --grpc_out=${PROTO_DEST} \
  -I ${PROTO_SRC} \
  ${PROTO_SRC}/*

npx grpc_tools_node_protoc \
  --ts_out=${PROTO_DEST} \
  -I ${PROTO_SRC} \
  ${PROTO_SRC}/*

$PROTOC \
  --plugin=$PROTOC_GEN_GRPC_WEB \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:${PROTO_DEST} \
  -I ${PROTO_SRC} \
  ${PROTO_SRC}/*