import Vue from 'vue'
import untar from "js-untar"
const CID_RE = /Qm[1-9A-HJ-NP-Za-km-z]{44,}|b[A-Za-z2-7]{58,}|B[A-Z2-7]{58,}|z[1-9A-HJ-NP-Za-km-z]{48,}|F[0-9A-F]{50,}/m

// for creating new NFTs with EFFECTS
export function createRandomNft(token_id, metadata, receiver_id, contract) {
  try {
    contract
      .nft_mint({
        token_id,
        metadata,
        receiver_id,
      }, "300000000000000", '9610000000000000000000')
  } catch(err) {
    console.error(err, '')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: `Error - ${err}`,
    })
  }
}

// for creating new NFTs BY inputs FORM
export function createUsualNFT(token_id, metadata, receiver_id, contract) {
  try {
    contract
      .nft_mint({
        token_id,
        metadata,
        receiver_id,
      }, "300000000000000", '9610000000000000000000')
      .then((data) => {
        console.log(data, 'getNftTotal')
      })
  } catch(err) {
    console.error(err, '')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: `Error - ${err}`,
    })
  }
}

export function createBundleNFT(token_id, metadata, bundles, contract) {
  try {
    contract
      .nft_bundle({
        token_id,
        metadata,
        bundles,
      }, "300000000000000", '9610000000000000000000')
  } catch(err) {
    console.error(err, '')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: `Error - ${err}`,
    })
  }
}

// for creating new NFTs BY inputs FORM
export function unbundleNFT(token_id, contract) {
  try {
    contract
      .nft_unbundle({
        token_id,
      }, "300000000000000", '1')
  } catch(err) {
    console.error(err, '')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: `Error - ${err}`,
    })
  }
}

export async function nftTokensForOwner({dispatch}, account_id, contract, limit) {
  let NFTs = []
  console.log(account_id, contract, 'tokens')
  try {
    await contract
      .nft_tokens_for_owner({ account_id, limit })
      .then((data) => NFTs = data)

    dispatch('setNFTsLoading', false)
  } catch(err) {
    console.error(err, '')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: `Cant load Owner NFTs. Error - ${err}`,
    })
  }

  return NFTs
}

export function approveNFT(account_id, token_id, contract) {
  try {
    contract
      .nft_approve({
        account_id,
        token_id,
      }, "300000000000000", '520000000000000000000')
  } catch(err) {
    console.error(err, '')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: `Error - ${err}`,
    })
  }
}

export function sendNFT(receiver_id, token_id, contract) {
  try {
    contract
      .nft_transfer({
        receiver_id,
        token_id,
        approval_id: 1,
        memo: 'testing'
      }, "300000000000000", '1')
      .then((data) => {
        console.log(data, 'nftTokensForOwner')
      })
  } catch(err) {
    console.error(err, '')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: `Error - ${err}`,
    })
  }
}

// currently unavailable

// export function burnNFT() {
//   console.log('approve')
//   window.contract
//     .nft_burn({
//       account_id: 'near_testing.testnet',
//       token_id: this.nftObj.token_id[0],
//     }, "300000000000000", '1210000000000000000000')
//     .then((data) => {
//       console.log(data, 'approveNFT')
//     })
// }

// just for tests
export function nftTokendata(contract, token_id) {
  try {
    contract
      .nft_token({ token_id })
      .then((data) => {
        console.log(data, 'nftTokendata')
      })
  } catch(err) {
    console.error(err, '')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: `Error - ${err}`,
    })
  }
}

// just for tests
export function nftMetadata(contract) {
  try {
    contract
      .nft_metadata()
      .then((data) => {
        console.log(data, 'nftMetadata')
      })
  } catch(err) {
    console.error(err, '')
    Vue.notify({
      group: 'foo',
      title: 'Important message',
      text: `Error - ${err}`,
    })
  }
}

// todo: make v1 to v2, or rethink v1 for more effective implementation
async function pushImageToIpfs(ipfsInstance, objectURL) {
  let cid = ''
  let cidV1 = ''
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
  let cid = await ipfsInstance.add(JSON.stringify(object))
  return cid
}

export async function deployNFTtoIPFS(ipfsInstance, imageURL, oldMeta, type) {
  let imageCID = await pushImageToIpfs(ipfsInstance, imageURL, type)
  let meta = JSON.parse(JSON.stringify(oldMeta))
  meta.animation_url = `ipfs://${imageCID}`
  await pushObjectToIpfs(ipfsInstance, meta)
  return `https://ipfs.io/ipfs/${imageCID}`
}

export async function getImageForTokenByURI(ipfsInstance, imageAddress) {
  let image
  if (imageAddress) {
    let cid = CID_RE.exec(imageAddress)?.[0]

    // todo: differ IPFS address with other https files
    if (cid) {
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