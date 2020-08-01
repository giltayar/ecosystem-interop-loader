'use strict'
import module from 'module'
import {fileURLToPath} from 'url'

const ORIGINAL_COMMONJS_SIGN = 'eiloriginalcjs'

const wrappedCommonJsModules = new Set()
const require = module.createRequire(import.meta.url)

let firstGetFormat = true

/**
 * @param {string} url
 * @param {Object} context (currently empty)
 * @param {Function} defaultGetFormat
 * @returns {Promise<{ format: string }>}
 */
export function getFormat(url, context, defaultGetFormat) {
  const originalFormat = defaultGetFormat(url, context, defaultGetFormat)

  if (firstGetFormat) {
    firstGetFormat = false
    return originalFormat
  }

  if (url.includes(`${ORIGINAL_COMMONJS_SIGN}`)) {
    return {format: 'commonjs'}
  } else if (originalFormat.format === 'commonjs') {
    wrappedCommonJsModules.add(url)
    return {format: 'module'}
  } else {
    return originalFormat
  }
}

/**
 * @param {string} url
 * @param {{ format: string }} context
 * @param {Function} defaultGetSource
 * @returns {Promise<{ source: !(SharedArrayBuffer | string | Uint8Array) }>}
 */
export function getSource(url, context, defaultGetSource) {
  if (!wrappedCommonJsModules.has(url)) {
    return defaultGetSource(url, context, defaultGetSource)
  }

  const thisModule = require(fileURLToPath(url))

  const commonSource = `
import m from ${JSON.stringify(transformToOriginalCommonJSFilename(url))};
export default m;
`

  if (thisModule == null || typeof thisModule !== 'object') {
    return {
      source: commonSource,
    }
  } else {
    const exportNames = Object.keys(thisModule)

    const source = `${commonSource}${exportNames
      .map((exportName) => `export const ${exportName} = m['${exportName}'];`)
      .join('\n')}`

    return {
      source,
    }
  }
}
function transformToOriginalCommonJSFilename(url) {
  const urlUrl = new URL(url)

  urlUrl.searchParams.set(ORIGINAL_COMMONJS_SIGN, '')

  return urlUrl.href
}
