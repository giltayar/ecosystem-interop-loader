'use strict'
import module from 'module'
import {fileURLToPath} from 'url'

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

  // I have no idea why this needs to be here. But if you try and remove it and run
  // the tests, they fail by just...ending when loading the Mocha CLI, which for some
  // reason is loaded by Node.js using the ESM loader mechanism. This should still have
  // worked, but for some odd reason which I don't understand, doesn't.
  if (firstGetFormat) {
    firstGetFormat = false
    return originalFormat
  }

  if (originalFormat.format === 'commonjs') {
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

  const commonSource = `
import module from 'module';
const require = module.createRequire(import.meta.url);
const m = require(${JSON.stringify(new URL(url).pathname)});
`

  const thisModule = require(fileURLToPath(url))

  if (thisModule == null || (typeof thisModule !== 'object' && typeof thisModule !== 'function')) {
    return {source: commonSource + 'export default m;'}
  } else {
    const isBabelTranspiled = !!thisModule.__esModule
    const exportNames = Object.keys(thisModule)

    const source = `
    ${commonSource}${isBabelTranspiled ? 'export default m.default' : 'export default m'}
    ${exportNames
      .map((exportName) =>
        // remove an export if it's named "default" because that creates a syntax error
        // in ESM.
        exportName === 'default'
          ? ''
          : // this weird way to export is
            // because "exportName" may be a reserved word (e.g. "static"),
            // and this is the only way to export it
            `const __${exportName} = m['${exportName}']; export {__${exportName} as ${exportName}}`,
      )
      .join('\n')}`

    return {source}
  }
}
