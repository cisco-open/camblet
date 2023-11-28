# tiny-async-pool

## Why?

The goal of this library is to use the native async iterator (ES9), native async functions, and native Promise to implement concurrent/batched work.

## What?

`doWorkAndYield` runs multiple promise-returning & async functions in a limited concurrency pool. It rejects immediately as soon as one of the promises rejects. It calls the iterator function as soon as possible (under concurrency limit). It returns an async iterator that yields as soon as a promise completes (under concurrency limit). For example:

```js
const timeout = (ms) =>
  new Promise((resolve) => setTimeout(() => resolve(ms), ms));

for await (const ms of doWorkAndYield(2, [1000, 5000, 3000, 2000], timeout)) {
  console.log(ms);
}
// Call iterator timeout(1000)
// Call iterator timeout(5000)
// Concurrency limit of 2 reached, wait for the quicker one to complete...
// 1000 finishes
// for await...of outputs "1000"
// Call iterator timeout(3000)
// Concurrency limit of 2 reached, wait for the quicker one to complete...
// 3000 finishes
// for await...of outputs "3000"
// Call iterator timeout(2000)
// Itaration is complete, wait until running ones complete...
// 5000 finishes
// for await...of outputs "5000"
// 2000 finishes
// for await...of outputs "2000"
```

## Usage

```
$ npm install @altano/tiny-async-pool
```

```js
import { doWorkAndYield } from "@altano/tiny-async-pool";
```

### ES9 for await...of

```js
for await (const value of doWorkAndYield(concurrency, iterable, iteratorFn)) {
  console.log(value);
}
```

## API

### `doWorkAndYield(concurrency, iterable, iteratorFn)`

Runs multiple promise-returning & async functions in a limited concurrency pool. It rejects immediately as soon as one of the promises rejects. It calls the iterator function as soon as possible (under concurrency limit). It returns an async iterator that yields as soon as a promise completes (under concurrency limit).

#### concurrency

The concurrency limit number (>= 1).

#### iterable

An input [iterable object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#the_iterable_protocol), such as [`String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String), [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array), [`TypedArray`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray), [`Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), and [`Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set).

#### iteratorFn

Iterator function that takes two arguments: the value of each iteration and the iterable object itself. The iterator function should either return a promise or be an async function.

### `doWork(concurrency, iterable, iteratorFn)`

The same as `doWorkAndYield(...)` but just returns a Promise that resolves when all work resolves/rejects, e.g.:

```js
const timeout = (ms) =>
  new Promise((resolve) => setTimeout(() => resolve(ms), ms));

await doWork(2, [1000, 5000, 3000, 2000], timeout);
```

## License

This project is a fork of `async-pool` by Rafael Xavier de Souza. It modernizes (as of 2022) the library by being a first-class TypeScript and ESM module.

MIT © [Rafael Xavier de Souza](http://rafael.xavier.blog.br)
MIT © [Alan Norbauer](https://alan.norbauer.com)
