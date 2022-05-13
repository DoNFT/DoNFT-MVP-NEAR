import axios from "axios"
import { SystemErrors } from "@/utilities"

const api  = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  timeout: 60000,
})

export default api

export async function uploadtoIPFS (data) {
  let result = null
  const formData = new FormData()
  const fetchUrl = await fetch(data)
  const file = await fetchUrl.blob()
  formData.append("payload", file) 

  try {
    result = await api.post("/ipfs/upload",  formData)
    console.log(result, "RESULT")
  } catch(err) {
    console.log(err, "error modifyPicture")
  }

  return result ? result.data : null
}

export async function modifyPicture (objectURL, effectId) {
  let item = null

  try {
    let result = await api.post(`/effects/applyWithImgUrl/${effectId}?img_url=${objectURL}`, "", { 
      headers: { 
        'accept': 'image/gif', 
        'Content-Type': 'text/html', 
      }, 
      responseType: 'blob' 
    })
    item = URL.createObjectURL(result.data)
  } catch(err) {
    console.log(err)
    throw SystemErrors.NFT_EFFECT_CONFIRM
  }

  return item
}

export async function applyNFTsEffect (effectData) {
  let result = null

  try {
    result = await api.post('/effects/applyEffect', effectData, {responseType: 'blob'})
  } catch(err) {
    console.log(err)
    throw SystemErrors.NFT_EFFECT_CONFIRM
  }
  const bundleImageTempURL = URL.createObjectURL(result.data)
  console.log(bundleImageTempURL, 'bundleImageTempURL')
  let cid = null

  console.log(result.headers.contenturl, 'result.headers.contenturl APPLY NFT EFFECT')
  if (result) {
    cid = `https://ipfs.io/${result.headers.contenturl.replace(':/', '')}`
  }
  console.log(cid, 'CID APPLY NFT EFFECT')

  return cid ? { cid, hashBlob: bundleImageTempURL } : null
}