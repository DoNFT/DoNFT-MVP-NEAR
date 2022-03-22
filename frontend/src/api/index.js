import axios from "axios"

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
    console.log(err, 'error modifyPicture')
  }

  return item
}

export async function applyNFTsEffect (effectData) {
  let result = null

  try {
    result = await api.post('/effects/applyEffect', effectData)
  } catch(err) {
    console.log(err, 'error applyNFTsEffect')
  }

  return result ? result.data : null
}