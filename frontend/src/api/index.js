import axios from "axios"

const api  = axios.create({
  baseURL: process.env.VUE_APP_API_URL,
  timeout: 60000,
})

export default api


export async function getNftInfosByAddress(accountAddress) {
  return (await api.get(`/nfts/${accountAddress}`)).data
}

export async function getEffects() {
  return (await api.get('/effects')).data
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

// hardcode until back fix new api
export async function modifyTransferPicture (objectBase, effectId) {
  let result = await api.post(`/effects/applyWithImgUrl/${effectId}?img_url='https://upload.wikimedia.org/wikipedia/commons/a/af/VitalikButerinProfile.jpg'`, "", { 
    headers: {
      'accept': 'image/gif', 
      'Content-Type': 'text/html', 
    }, 
    responseType: 'blob' 
  })
  const item = URL.createObjectURL(result.data)

  return item
}

export async function getPicture (objectURL) {
  let result = await api.get(`${objectURL}`,)

  return result.url
}