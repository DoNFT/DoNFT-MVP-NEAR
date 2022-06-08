#!/bin/bash
export $(grep -v '^#' .env | xargs)

set -e && RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release && mkdir -p ./out && cp target/wasm32-unknown-unknown/release/*.wasm ./out/main.wasm

near login

near create-account $NFT_CONTRACT_ID --masterAccount $MAIN_ACCOUNT --initialBalance 10
near deploy --accountId $NFT_CONTRACT_ID --wasmFile out/main.wasm
near call $NFT_CONTRACT_ID new_default_meta '{"owner_id": "'$NFT_CONTRACT_ID'"}'  --accountId $NFT_CONTRACT_ID 
near view $NFT_CONTRACT_ID nft_metadata
