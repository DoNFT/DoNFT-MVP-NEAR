# near-mvp

MVP проекта на Near

###
Frontend starting guide:
###

Node:
Version while dev 15.14.0

1. Change or copy .env.development.local to .env
2. yarn install
3. yarn serve
4. finally check localhost:8080

###
Deploying Smart-contract to near guide:
###

Case: testing on nft-example.near_testing.testnet

1. near login (if unavailable -> npm install -g near-cli)
2. Check your .env -> VUE_APP_CONTRACT_NAME=nft-example.near_testing.testnet
3. yarn dev:deploy:contract

Case: new Smart-contract project

1. near login
2. near create-account nft-example.your-account.testnet --masterAccount your-account.testnet --initialBalance 10
3. Create vars:
- NFT_CONTRACT_ID=nft-example.your-account.testnet
- MAIN_ACCOUNT=your-account.testnet
4. near deploy --accountId $NFT_CONTRACT_ID --wasmFile out/main.wasm
5. near call $NFT_CONTRACT_ID new_default_meta '{"owner_id": "'$NFT_CONTRACT_ID'"}' --accountId $NFT_CONTRACT_ID
