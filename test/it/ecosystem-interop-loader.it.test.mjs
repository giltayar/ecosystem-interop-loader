'use strict'
import fs from 'fs'
import path from 'path'
import mocha from 'mocha'
import chai from 'chai'

const {describe, it, before} = mocha
const {expect} = chai

const __dirname = path.dirname(new URL(import.meta.url).pathname)

describe('cjs named exports', function () {
  describe('relative specifiers', () => {
    it('should import a CJS with no exports as a "no exports" module', async () => {
      const result = await import('./cjs-modules-for-testing/no-exports.js')

      expect({...result}).to.eql({default: undefined})
    })

    it('should import a CJS with non-object exports as a module with default', async () => {
      const result = await import('./cjs-modules-for-testing/export-number-4.js')

      expect({...result}).to.eql({default: 4})
    })

    it('should import a CJS with named exports as a module with default and named-exports', async () => {
      const result = await import('./cjs-modules-for-testing/export-object-a-4-b-5.js')

      expect({...result}).to.eql({default: {a: 4, b: 5}, a: 4, b: 5})
    })
  })

  describe('bare specifiers', () => {
    const nodeModulesDir = path.join(__dirname, 'node_modules')

    before(async () => {
      await fs.promises.mkdir(nodeModulesDir, {
        recursive: true,
      })
    })

    it('should import a CJS with no exports as a "no exports" module', async () => {
      await copyFileIntoPackage(
        path.join(__dirname, './cjs-modules-for-testing/no-exports.js'),
        path.join(nodeModulesDir, 'no-exports'),
      )
      // eslint-disable-next-line
      const result = await import('no-exports')

      expect({...result}).to.eql({default: undefined})
    })

    it('should import a CJS with non-object exports as a module with default', async () => {
      await copyFileIntoPackage(
        path.join(__dirname, './cjs-modules-for-testing/export-number-4.js'),
        path.join(nodeModulesDir, 'export-number-4'),
      )
      // eslint-disable-next-line
      const result = await import('export-number-4')

      expect({...result}).to.eql({default: 4})
    })

    it('should import a CJS with default and named-exports', async () => {
      await copyFileIntoPackage(
        path.join(__dirname, './cjs-modules-for-testing/export-object-a-4-b-5.js'),
        path.join(nodeModulesDir, 'export-object-a-4-b-5'),
      )
      // eslint-disable-next-line
      const result = await import('export-object-a-4-b-5')

      expect({...result}).to.eql({default: {a: 4, b: 5}, a: 4, b: 5})
    })
  })

  describe('edge cases', () => {
    it('should import CJS where default is a function and named exports are props of that function', async () => {
      const result = await import('./cjs-modules-for-testing/export-function-and-objs.js')

      expect({...result}).to.containSubset({anotherNumber: 7, yetAnotherNumber: 17})
      expect(result.default()).to.equal(42)
    })

    it('should allow importing a reserved keyword', async () => {
      const result = await import('./cjs-modules-for-testing/export-reserved-keyword.js')

      expect(result.static).to.equal('static is a reserved keyword')
    })

    it(`should support babel/ts-transpiled modules who's "default" export is explicit`, async () => {
      const result = await import('./cjs-modules-for-testing/export-like-babel.js')

      expect({...result}).to.eql({default: 42, a: 4, b: 5})
    })
  })
})

async function copyFileIntoPackage(filename, directory) {
  await fs.promises.mkdir(directory, {recursive: true})
  const content = await fs.promises.readFile(filename)

  await fs.promises.writeFile(path.join(directory, 'index.js'), content)
  await fs.promises.writeFile(path.join(directory, 'package.json'), '{"main": "./index.js"}')
}
