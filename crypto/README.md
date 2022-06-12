# DoNFT MVP for NEAR Smart Contract

Based on https://docs.near.org/docs/tutorials/contracts/nfts/introduction#

Aditional functions:
- bundling NFTs
- unbundling NFT

## Build smart contract

npm run build

## Deploy smart contract

Set up .env

###
NFT_CONTRACT_ID=approve_bundle2.near_testy.testnet
MAIN_ACCOUNT=near_testy.testnet
###

npm run deploy --env=.env