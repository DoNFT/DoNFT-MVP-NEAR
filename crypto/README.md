# DoNFT MVP for NEAR Smart Contract

Based on https://docs.near.org/docs/tutorials/contracts/nfts/introduction#

donft-bundle - standard nft contract with aditional functions:
- bundling NFTs
- unbundling NFT

donft-collection-factory --- contract which gonna help deploy new contracts from frontend (currently donft-bundle contract)

donft-effects --- special for saving/removing effects contracts for different NFTs

## Build smart contract

npm run build

## Deploy smart contract

npm run deploy --env=.env

###
NFT_CONTRACT_ID=approve_bundle2.near_testy.testnet
MAIN_ACCOUNT=near_testy.testnet
###