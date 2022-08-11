import untar from "js-untar"
import { SystemErrors, CID_RE  } from "@/utilities"
// import { NFTStorage } from "nft.storage/dist/bundle.esm.min.js"

const attachedGas = "300000000000000"
const attachedTokens = "1"

import { initNewContract } from "@/nearConfig"

// const API_KEY = process.env.VUE_APP_NFT_STORAGE_API_KEY

import { uploadtoIPFS} from "@/api"

// const client = new NFTStorage({
//   token: API_KEY,
// })

// firstly, search among 3 main contracts
// if not found, init new Contract, for using change method
export async function checkForContract(getters, minting_contract_id) {
  let findMainContract = null
  console.log(getters, minting_contract_id, 'getters.getMainContracts')
  
  findMainContract = getters.getMainContracts ? getters.getMainContracts.find((item) => item === minting_contract_id) : []
  console.log(findMainContract, 'getters.findMainContract')
  
  if (findMainContract && findMainContract.length) {
    return [getters.getBundleContract, getters.getContract, getters.getEffectsContract, getters.getEffectsListContract].find((item) => item.contractId === findMainContract)
  }

  if (!findMainContract) {
    return await initNewContract(minting_contract_id, this)
  }
}


export async function removeEffectContract(effect_info_address, contract) {
  await contract
    .remove_effect_contract_from_list({
      effect_info_address,
    }, attachedGas, '100000000000000000000000')
}
export async function addNewEffectContract(effect_data, contract) {
  await contract
    .add_effect_contract_to_list({
      effect_data,
    }, attachedGas, '100000000000000000000000')
}

// for creating new NFTs
export async function createUsualNFT(token_id, metadata, receiver_id, contract) {
  await contract
    .nft_mint({
      token_id,
      metadata,
      receiver_id,
    }, attachedGas, '100000000000000000000000')
}

export async function removeTokenFromBundle(contract, remove_token_data, bundle_token_id) {
  console.log(contract, remove_token_data, 'contract')
  await contract
    .remove_token_from_bundle({
      remove_token_data,
      bundle_token_id,
    }, attachedGas, '1')
}

export async function addTokenToBundle(contract, token_to_add_data, tokens_to_approve, bundle_token_id) {
  console.log(contract, token_to_add_data, 'contract')
  await contract
    .add_token_to_bundle({
      token_to_add_data,
      tokens_to_approve,
      bundle_token_id,
    }, attachedGas, '100000000000000000000000')
}

// will be removed later, currently only for debugging
export async function getOwnerNFTs(accountId, contract) {
  console.log(contract, 'contract')
  await contract
    .nft_tokens().then((res) => console.log(res, 'TOKENS getOwnerNFTs'))
  await contract
    .nft_total_supply().then((res) => console.log(res, 'TOKENS nft_total_supply'))
  await contract
    .nft_tokens_for_owner({ account_id: accountId }).then((res) => console.log(res, 'TOKENS nft_supply_for_owner'))
}

export function createBundleNFT(token_id, metadata, bundles, owner_id, contract) {
  console.log(contract, 'contract')
  contract
    .nft_bundle({
      token_id,
      metadata,
      bundles,
      owner_id,
    }, attachedGas, '100000000000000000000000')
}

export function bundleWithApprove(tokens_for_approve, account_for_approve, contract_of_tokens, token_id, metadata, bundles, owner_id, contract) {
  console.log(contract, 'contract')
  contract
    .nft_bundle_with_approve({
      tokens_for_approve,
      account_for_approve,
      contract_of_tokens,
      token_id,
      metadata,
      bundles,
      owner_id,
    }, attachedGas, '100000000000000000000000')
}

// for creating new NFTs BY inputs FORM
export async function unbundleNFT(token_id, contract) {
  await contract
    .nft_unbundle({
      token_id,
    }, attachedGas, attachedTokens)
}

export async function approveNFT(account_id, token_id, contract) {
  await contract
    .nft_approve({
      account_id,
      token_id,
    }, attachedGas, '700000000000000000000')
}

export async function sendNFT(receiver_id, token_data, contract) {
  console.log(receiver_id, token_data, contract, 'receiver_id, token_id, contract')
  // todo: possibly will need to change logic of urls revoking, discussable
  URL.revokeObjectURL(token_data.metadata.media_hash)

  await contract
    .nft_transfer({
      receiver_id,
      token_id: token_data.token_id,
      approval_id: 0,
      memo: 'NFT send',
    }, attachedGas, attachedTokens)
}

async function pushImageToIpfs(ipfsInstance, objectURL) {
  let cidV1 = ''

  const imageIPFS = await uploadtoIPFS(objectURL)
  console.log(imageIPFS, 'CIT uploadtoIPFS')
  let executedCID = CID_RE.exec(imageIPFS)?.[0]
  // currently saving only href on ipfs
  cidV1 = `https://ipfs.io/ipfs/${executedCID}/file`

  return cidV1
}

export async function deployNFTtoIPFS(ipfsInstance, imageURL, oldMeta, type) {
  let imageCID = null

  try {
    imageCID = await pushImageToIpfs(ipfsInstance, imageURL, type)
  } catch(err) {
    console.log(err)
    throw SystemErrors.IPFS_SAVE
  }

  return imageCID
}

export async function getImageForTokenByURI(ipfsInstance, imageAddress) {
  let image = null
  console.log(imageAddress, 'imageAddress')

  if (!imageAddress) {
    return null
  }

  if (imageAddress.startsWith('ipfs') || imageAddress.startsWith('https://ipfs'))  {
    let ipfsAddres = imageAddress

    // nft.storage return images with /blob in the end
    // server on apply effect return image without /blob
    let cid = CID_RE.exec(imageAddress)?.[0] || ipfsAddres
    let localImageURL = null

    if (ipfsAddres.endsWith("/file")) {
      localImageURL = await getImageFromIpfs(ipfsInstance, `${cid}/file`)
    } else {
      localImageURL = await getImageFromIpfs(ipfsInstance, cid)
    }

    image = localImageURL
  } else {
    image = imageAddress
  }
  return image
}

async function getImageFromIpfs(ipfsInstance, cid) {
  let blob = null
  try {
    blob = await loadFileFromIPFS(ipfsInstance, cid, 6000)
  } catch (e) {
    console.log(e)
    throw SystemErrors.IPFS_GET_IMAGE
  }
  return blob ? URL.createObjectURL(blob) : null
}

async function loadFileFromIPFS(ipfs, cid, timeout) {
  if (cid === "" || cid === null || cid === undefined) {
    return
  }
  let content = []
  for await (const buff of ipfs.get(cid, {timeout})) {
    if (buff) {
      content.push(buff)
    }
  }
  let archivedBlob = new Blob(content, {type: "application/x-tar"})
  let archiveArrayBuffer = await archivedBlob.arrayBuffer()
  let archive = (await untar(archiveArrayBuffer))?.[0]

  return archive.blob
}