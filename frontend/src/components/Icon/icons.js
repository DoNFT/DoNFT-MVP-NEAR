/* eslint sort-imports: 'error' */
/* eslint sort-keys: 'error' */
import cross from '!svg-sprite-loader!@/assets/svg/icon-cross.svg'
import near from '!svg-sprite-loader!@/assets/svg/near.svg'
import pencil from '!svg-sprite-loader!@/assets/svg/icon-pencil.svg'
import plus from '!svg-sprite-loader!@/assets/svg/icon-plus.svg'
import trash from '!svg-sprite-loader!@/assets/svg/icon-trash.svg'
import upload from '!svg-sprite-loader!@/assets/svg/icon-upload.svg'

const ICONS = {
  cross,
  near,
  pencil,
  plus,
  trash,
  upload,
}

function camelCaseToDash(str) {
  return str.replace(/([a-zA-Z])(?=[A-Z])/g, '$1-').toLowerCase()
}

Object.keys(ICONS).forEach((key) => {
  const dashKey = camelCaseToDash(key)
  ICONS[dashKey] = ICONS[key]
})

export default ICONS
