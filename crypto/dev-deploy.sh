#!/bin/bash
set -e && RUSTFLAGS='-C link-arg=-s' cargo build --target wasm32-unknown-unknown --release && mkdir -p ./out && cp target/wasm32-unknown-unknown/release/*.wasm ./out/main.wasm
near dev-deploy --wasmFile out/donft_bundle.wasm

# DEV_CONTRACT=DEV_DEPLOY_ID
# near call $DEV_CONTRACT new_meta '{"owner_id": "'$DEV_CONTRACT'", "total_supply": "1000000000000000", "metadata": { "spec": "ft-1.0.0", "name": "Example Token Name", "symbol": "EXLT", "decimals": 8 }}' --accountId $DEV_CONTRACT

# for effects list contract
# near call $DEV_CONTRACT new_effects_meta --accountId $DEV_CONTRACT
# near call $DEV_CONTRACT add_manager_of_contracts '{"account_id": "near_testy2.testnet"}' --accountId $DEV_CONTRACT