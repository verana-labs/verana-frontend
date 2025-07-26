
# VERANA FRONT - Next.js Starter Project 

This is a starter project for React that uses Next.js.

## Running locally in development mode

We recommend using yarn as your package manager, as it's faster and more efficient than npm. If you don't have yarn installed, you can install it globally by running:
    
    npm install --global yarn

To get started, just clone the repository:

    git clone https://github.com/verana-labs/verana-frontend.git

and run `yarn install && yarn dev`:

    yarn install
    yarn dev

## Building and deploying in production

If you wanted to run this site in production, you should install modules then build the site with `yarn build` and run it with `yarn start`:

    yarn install
    yarn build
    yarn start
    


## how to build and run the docker image locally

```
docker build -t verana-front .
```


```
docker run -it \
  -e NEXT_PUBLIC_PORT=3000 \
  -e NEXT_PUBLIC_BASE_URL=http://localhost:2904 \
  -e NEXT_PUBLIC_VERANA_CHAIN_ID=vna-devnet-1 \
  -e NEXT_PUBLIC_VERANA_CHAIN_NAME=VeranaDevnet1 \
  -e NEXT_PUBLIC_VERANA_RPC_ENDPOINT=http://node1.devnet.verana.network:26657 \
  -e NEXT_PUBLIC_VERANA_REST_ENDPOINT=http://node1.devnet.verana.network:1317 \
  -e NEXT_PUBLIC_VERANA_REST_ENDPOINT_GET_ACCOUNT=http://node1.devnet.verana.network:1317/verana/td/v1/get \
  -e NEXT_PUBLIC_VERANA_REST_ENDPOINT_LIST_DID=http://node1.devnet.verana.network:1317/verana/dd/v1/list \
  -e NEXT_PUBLIC_VERANA_REST_ENDPOINT_GET_DID=http://node1.devnet.verana.network:1317/verana/dd/v1/get \
  -p 3000:3000 \
  verana-frontend
```


```
docker run -it \
  -e NEXT_PUBLIC_PORT=3000 \
  -e NEXT_PUBLIC_BASE_URL=http://localhost:2904 \
  -e NEXT_PUBLIC_VERANA_CHAIN_ID=vna-testnet-1 \
  -e NEXT_PUBLIC_VERANA_CHAIN_NAME=VeranaTestnet1 \
  -e NEXT_PUBLIC_VERANA_RPC_ENDPOINT=http://node1.testnet.verana.network:26657 \
  -e NEXT_PUBLIC_VERANA_REST_ENDPOINT=http://node1.testnet.verana.network:1317 \
  -e NEXT_PUBLIC_VERANA_REST_ENDPOINT_GET_ACCOUNT=http://node1.testnet.verana.network:1317/verana/td/v1/get \
  -e NEXT_PUBLIC_VERANA_REST_ENDPOINT_LIST_DID=http://node1.testnet.verana.network:1317/verana/dd/v1/list \
  -e NEXT_PUBLIC_VERANA_REST_ENDPOINT_GET_DID=http://node1.testnet.verana.network:1317/verana/dd/v1/get \
  -p 3000:3000 \
  verana-frontend
```