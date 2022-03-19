#!/bin/bash
set -e && RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release && mkdir -p ./out && cp target/wasm32-unknown-unknown/release/*.wasm ./out/main.wasm
near login
near create-account nft-list.near_testing.testnet --masterAccount near_testing.testnet --initialBalance 10
NFT_CONTRACT_ID=nft-list.near_testing.testnet
MAIN_ACCOUNT=near_testing.testnet
echo $NFT_CONTRACT_ID
echo $MAIN_ACCOUNT
near deploy --accountId $NFT_CONTRACT_ID --wasmFile out/main.wasm
near call $NFT_CONTRACT_ID new_default_meta '{"owner_id": "'$NFT_CONTRACT_ID'"}'  --accountId $NFT_CONTRACT_ID 
near view $NFT_CONTRACT_ID nft_metadata
