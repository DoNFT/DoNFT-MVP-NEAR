import axios from "axios"
import { SystemErrors } from "@/utilities"

const api  = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  timeout: 60000,
})

export default api

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
    result = await api.post('/effects/applyEffect', effectData)
  } catch(err) {
    console.log(err)
    throw SystemErrors.NFT_EFFECT_CONFIRM
  }

  return result ? result.data : null
}