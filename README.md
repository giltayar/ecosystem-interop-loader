# ecosystem-interop-loader

An [ESM loader](https://nodejs.org/dist/latest/docs/api/esm.html#esm_experimental_loaders)
that enables importing named exports from CJS modules.

As some of you know, ESM in Node.js interoperates with CommonJS modules nicely. So, for example,
if you have a CommonJS module `cjs.js`:

```js
module.exports = {a: 4, b: 5}
```

You can import it using `import` from the ESM `esm.mjs`:

```js
import cjs from './cjs.js`

console.log(cjs) // {a: 4, b: 5}
```

But you can only use default exports. If you try to use named exports, thus...

```js
import {a, b} from './cjs.js`

console.log(a, b)
```

...then you will get an error, saying that you cannot import by name from CommonJS modules.

Wh this restriction of using named exports when importing CommonJS? This is
an unfortunate side-effect of the fact that the ESM specification does not allow executing a module
before binding the import variables, but the only way to determine what named imports the module
has is via execution. So during the binding phase of the import variables, Node.js
has to execute the CommonJS module to determine what the named exports are, but it's not allowed
to by the spec. So it allows only default exports.

> Note: Node.js could theoretically parse the CommonJS module to determine the named exports,
> but determining that will always be a heuristic, and will never give 100% good results.

But what Node.js taketh away, Node.js gives back: it allows the use of _ESM loaders_ that can
modify the behavior of `import`. And _this_ package is an ESM loader that modifies
the behavior of `import` to enable `import`-s to CommonJS to use named exports.

PLEASE READ "Big Big Caveat" BELOW FOR A BIG BIG CAVEAT WHEN USING THIS MODULE.

## Installing

> Note: this package was tested only in Node v13 and above.

```sh
npm install @applitools/ecosystem-interop-loader
```

## Using the package

To use the package, you need to use the `--experimental-loader` when running Node.js:

```sh
$ node --experimental-loader ecosystem-interop-loader esm.mjs
{a : 4, b: 5}
```

This will make all `import`-s of CJS modules be able to use named exports. In the example above,
`import`-ing `cjs.js` will result in both a default export
(which is an object with `a` and `b` properties), and two named exports `a` and `b`. Of course,
if the export from the CommonJS module is not an object, no named exports will be available.

If you wish, you can use `NODE_OPTIONS` to make it the default when running Node.js:

```sh
$ # use "set" instead of "export" in Windows
$ export NODE_OPTIONS=--experimental-loader ecosystem-interop-loader
$ node esm.mjs
{a : 4, b: 5}
```

## BIG BIG BIG CAVEAT

Using this loader will guarantee that the CJS modules will be executed out of order. For example,
if you have an ESM file `x.mjs`:

```js
import somethingElse from `./mjs.js`
import something from './cjs.js`
```

Then when executing `x.mjs` without a loader, first `mjs.js` will be executed, and then `cjs.js`
will be executed, as you would expect.

But if you use this loader, even if you're not using named exports/imports, the loader
will execute `cjs.js` to determine the named exports, and this happens in the binding phase,
and so will execute before `mjs.js`. This is not per-spec, and is the price you pay
for the ability to use CommonJS named exports using this loader.

So remember: when using this loader, all your CJS modules will execute before all the ES modules
will be executed.
