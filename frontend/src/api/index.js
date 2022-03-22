import axios from "axios"

const api  = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  timeout: 60000,
})

export default api


export async function getNftInfosByAddress(accountAddress) {
  return (await api.get(`/nfts/${accountAddress}`)).data
}

export async function modifyPicture (objectURL, effectId) {
  console.log(objectURL, 'object url')
  let result = await api.post(`/effects/applyWithImgUrl/${effectId}?img_url=${objectURL}`, "", { 
    headers: { 
      'accept': 'image/gif', 
      'Content-Type': 'text/html', 
    }, 
    responseType: 'blob' 
  })
  const item = URL.createObjectURL(result.data)

  return item
}

export async function applyNFTsEffect (effectData) {
  let result = await api.post('/effects/applyEffect', effectData)
  return result.data
}