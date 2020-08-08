'use strict'
import {sh} from '@bilt/scripting-commons'
import path from 'path'
import {expect, use} from 'chai'
import mocha from 'mocha'
const {describe, it} = mocha
import chaiSubset from 'chai-subset'
use(chaiSubset)

const __dirname = path.dirname(new URL(import.meta.url).pathname)

describe('try a package with lots of real dependencies (e2e)', () => {
  it('should import real dependencies using named exports', async () => {
    await sh('npm install', {cwd: './test/e2e/package-with-real-dependencies'})

    const result = await import('./package-with-real-dependencies/try-importing.mjs')

    const isAFunction = (x) => typeof x === 'function'

    expect(result).to.containSubset({
      createElement: isAFunction,
      zip: isAFunction,
      json: isAFunction,
    })
  })
})
