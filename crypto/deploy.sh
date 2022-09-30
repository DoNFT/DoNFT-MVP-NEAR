#!/bin/bash
export $(grep -v '^#' .env | xargs)

set -e && RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release && mkdir -p ./out && cp target/wasm32-unknown-unknown/release/*.wasm ./out/main.wasm

near login

near create-account $NFT_CONTRACT_ID --masterAccount $MAIN_ACCOUNT --initialBalance 6
near deploy --accountId $NFT_CONTRACT_ID --wasmFile out/donft_bundle.wasm
near call $NFT_CONTRACT_ID new_meta '{"owner_id": "'$NFT_CONTRACT_ID'", "total_supply": "5000000000000", "metadata": { "spec": "ft-1.0.0", "name": "Example Token Name", "symbol": "EXLT", "decimals": 8 }}'  --accountId $NFT_CONTRACT_ID 
near view $NFT_CONTRACT_ID nft_metadata

# EFFECTS WL
near call $NFT_CONTRACT_ID new_effects_meta --accountId $NFT_CONTRACT_ID
near call $NFT_CONTRACT_ID add_manager_of_contracts '{"account_id": "near_testy2.testnet"}' --accountId $NFT_CONTRACT_ID