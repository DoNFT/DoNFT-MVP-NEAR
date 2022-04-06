import untar from "js-untar"
import { SystemErrors } from "@/utilities"

const CID_RE = /Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,}/m
const attachedGas = "300000000000000"
const attachedTokens = "1"

import {
  initNewContract,
} from "@/nearConfig"

// firstly, search among 3 main contracts
// if not found, init new Contract, for using change method
export async function checkForContract(getters, minting_contract_id) {
  let findMainContract = null
  
  findMainContract = getters.getMainContracts.find((item) => item === minting_contract_id)
  
  if (findMainContract) {
    return [getters.getBundleContract, getters.getContract, getters.getEffectsContract].find((item) => item.contractId === findMainContract)
  }
  
  if (!findMainContract) {
    return await initNewContract(minting_contract_id, this)
  }
}

// for creating new NFTs BY inputs FORM
export async function createUsualNFT(token_id, metadata, receiver_id, contract) {
  await contract
    .nft_mint({
      token_id,
      metadata,
      receiver_id,
    }, attachedGas, '100000000000000000000000')
}

export async function createBundleNFT(token_id, metadata, bundles, contract) {
  await contract
    .nft_bundle({
      token_id,
      metadata,
      bundles,
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
  console.log(contract, 'contract')
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
  let cid = ''
  let data = null
  await fetch(objectURL)
    .then(res => {
      console.log(res, 'buffer res')
      return res.arrayBuffer()
    })
    .then(buffer => {
      console.log(buffer, 'buffer data')
      data = new Uint8Array(buffer)
    })
  cid = await ipfsInstance.add(data)
  cidV1 = cid.path

  return cidV1
}

async function pushObjectToIpfs(ipfsInstance, object) {
  let cid = null
  cid = await ipfsInstance.add(JSON.stringify(object))
  return cid
}

export async function deployNFTtoIPFS(ipfsInstance, imageURL, oldMeta, type) {
  let imageCID = null
  let meta = null

  try {
    imageCID = await pushImageToIpfs(ipfsInstance, imageURL, type)
    meta = JSON.parse(JSON.stringify(oldMeta))
    meta.animation_url = `ipfs://${imageCID}`
  } catch(err) {
    console.log(err)
    throw SystemErrors.IPFS_SAVE
  }

  try {
    await pushObjectToIpfs(ipfsInstance, meta)
    return `https://ipfs.io/ipfs/${imageCID}`
  } catch(err) {
    console.log(err)
    throw SystemErrors.IPFS_SAVE
  }
}

export async function getImageForTokenByURI(ipfsInstance, imageAddress) {
  let image
  if (imageAddress) {
    if (imageAddress.startsWith('ipfs') || imageAddress.startsWith('https://ipfs'))  {
      let cid = CID_RE.exec(imageAddress)?.[0]
      let localImageURL = await getImageFromIpfs(ipfsInstance, cid)
      image = localImageURL
    } else {
      image = imageAddress
    }
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