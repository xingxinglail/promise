import * as chai from 'chai'
import * as sinon from 'sinon'
import * as sinonChai from 'sinon-chai'
import Promise, { State } from '../src/index'

chai.use(sinonChai)
const assert = chai.assert

describe('Promise', () => {

    it('Promise 是个类', () => {
        assert.isFunction(Promise)
    })

    it('Promise 必须接受一个函数作为参数', () => {
        assert.throws(() => {
            // @ts-ignore
            new Promise()
        })
        assert.throws(() => {
            new Promise(1)
        })
        assert.throws(() => {
            new Promise(false)
        })
    })

    it('2.1.2 fulfilled 状态时：不能再状态为任何其他状态，必须有一个 value，且不可改变', done => {
        const promise = new Promise((resolve, reject) => {
            resolve('hello')
            reject()
        });
        promise.then((value) => {
            assert(value === 'hello')
            assert(promise.state === State.fulfilled)
            done()
        })
    })

    it('2.1.3 rejected 状态时：不能再状态为任何其他状态，必须有一个 reason，且不可改变', done => {
        const promise = new Promise((resolve, reject) => {
            reject('error')
            resolve('hello')
        });
        promise.then(null, (reason) => {
            assert(reason === 'error')
            assert(promise.state === State.rejected)
            done()
        })
    })

    it('2.2 Promise 必须提供一个then方法', () => {
        const promise = new Promise((resolve) => {
            resolve()
        })
        assert.isFunction(promise.then)
    })

    it('2.2.1 onFulfilled 和 onRejected 都是可选参数,如果 onFulfilled 不是函数，它会被忽略,如果 onRejected 不是函数，它会被忽略', done => {
        const cb = sinon.fake()
        const promise = new Promise((resolve) => {
            resolve('hello')
        });
        promise
            .then(null, null)
            .then(cb)
        setTimeout(() => {
            assert(cb.called)
            done()
        })
    })

    it('2.2.1 onFulfilled 和 onRejected 都是可选参数,如果 onFulfilled 不是函数，它会被忽略,如果 onRejected 不是函数，它会被忽略', done => {
        const cb = sinon.fake()
        const promise = new Promise((_, reject) => {
            reject()
        })
        promise
            .then(() => {}, undefined)
            .then(() => {}, cb);
        setTimeout(() => {
            assert(cb.called)
            done()
        })
    })

    it('2.2.2 如果 onFulfilled 是一个函数，它一定是在 fulfilled 状态后调用，并且接受一个参数 value', done => {
        const promise = new Promise((resolve) => {
            resolve('hello')
        });
        promise.then((value) => {
            assert(promise.state === State.fulfilled)
            assert(value === 'hello')
            done()
        })
    })

    it('2.2.2 Promise 只能调用一次 onFulfilled', done => {
        const fn = sinon.fake()
        const promise = new Promise((resolve) => {
            resolve()
            resolve()
            resolve()
        });
        promise.then(fn)
        setTimeout(() => {
            assert.isTrue(fn.calledOnce)
            done()
        })
    })

    it('2.2.3 如果 onRejected 是一个函数，它一定是在 rejected 状态后调用，并且接受一个参数 reason', done => {
        const promise = new Promise((_, reject) => {
            reject('error')
        });
        promise.then(null, (value) => {
            assert(promise.state === State.rejected)
            assert(value === 'error')
            done()
        })
    })

    it('2.2.3 Promise 只能调用一次 onRejected', done => {
        const fn = sinon.fake()
        const promise = new Promise((_, reject) => {
            reject()
            reject()
            reject()
        });
        promise.then(null, fn)
        setTimeout(() => {
            assert.isTrue(fn.calledOnce)
            done()
        })
    })

    describe('2.2.4 onFulfilled 或 onRejected 只在执行环境堆栈只包含平台代码之后调用', () => {

        it('2.2.4 正常测试', done => {
            const fn = sinon.fake()
            const fn2 = sinon.fake()
            const promise = new Promise((resolve) => {
                resolve('hello')
            });
            promise.then(fn)
            assert(fn.notCalled)
            fn2()
            setTimeout(() => {
                assert(fn.calledAfter(fn2))
                assert(fn2.calledBefore(fn))
                done()
            })
        })

        it('2.2.4.1 promise.then中嵌套promise.then，先执行第一个在执行里面的', done => {
            const promise = new Promise((resolve) => {
                resolve('hello')
            })

            let firstOnFulfilledFinished = false
            promise.then(() => {
                promise.then(() => {
                    assert.equal(firstOnFulfilledFinished, true)
                    done()
                })
                firstOnFulfilledFinished = true
            })
        })

        it('2.2.4.2 promise.then中嵌套promise.then，当promise被拒绝时', done => {
            const promise = new Promise((_, reject) => {
                reject('hello')
            })

            let firstOnFulfilledFinished = false
            promise.then(null,() => {
                promise.then(null, () => {
                    assert.equal(firstOnFulfilledFinished, true)
                    done()
                })
                firstOnFulfilledFinished = true
            })
        })
    })

    it('2.2.5 onFulfilled 和 onRejected 会作为函数形式调用 this undefined', done => {
        new Promise((resolve) => {
            resolve()
        }).then(function () {
            assert.isUndefined(this)
        })
        new Promise((_, reject) => {
            reject()
        }).then(null, function () {
            assert.isUndefined(this)
        })
        setTimeout(done)
    })

    describe('2.2.6 在同一个 promise 实例中，then 可以链式调用多次', () => {
        it('当 promise 状态是 fulfilled 时，所有的 onFulfilled 回调回以他们注册时的顺序依次执行', done => {
            const cbs = [sinon.fake(), sinon.fake(), sinon.fake()]
            const promise = new Promise((resolve) => {
                resolve('hello')
            });
            promise.then(res => {
                cbs[0]()
                assert(res === 'hello')
            })
            promise.then(res => {
                cbs[1]()
                assert(res === 'hello')
            })
            promise.then(res => {
                cbs[2]()
                assert(res === 'hello')
            })
            setTimeout(() => {
                assert(cbs[0].calledBefore(cbs[1]))
                assert(cbs[1].calledBefore(cbs[2]))
                assert(cbs[2].calledAfter(cbs[1]))
                done()
            })
        })

        it('当 promise 状态是 rejected 时，所有的 onRejected 回调回以他们注册时的顺序依次执行', done => {
            const cbs = [sinon.fake(), sinon.fake(), sinon.fake()]
            const promise = new Promise((_, reject) => {
                reject('err')
            });
            promise.then(null, reason => {
                cbs[0]()
                assert(reason === 'err')
            })
            promise.then(null, reason => {
                cbs[1]()
                assert(reason === 'err')
            })
            promise.then(null, reason => {
                cbs[2]()
                assert(reason === 'err')
            })
            setTimeout(() => {
                assert(cbs[0].calledBefore(cbs[1]))
                assert(cbs[1].calledBefore(cbs[2]))
                assert(cbs[2].calledAfter(cbs[1]))
                done()
            })
        })
    })

    describe('2.2.7', () => {
        it('2.2.7 then必须返回一个promise', () => {
            const promise = new Promise(() => {})
            const promise2 = promise.then()
            assert(promise2 instanceof Promise)
        })

        it('2.2.7.1 如果then(success, fail) 中的 success 返回一个值x, 运行 promise2.resolve(x)', done => {
            const promise = new Promise(resolve => {
                resolve('hi')
            })
            const promise2 = promise.then((res) => {
                return res
            })
            promise2
                .then(res => {
                    assert.equal(res, 'hi')
                    return res + '!'
                })
                .then(res => {
                    assert.equal(res, 'hi!')
                    done()
                })
        })

        it('2.2.7.1 如果then(success, fail) 中的 fail 返回一个值x, 运行 promise2.resolve(x)', done => {
            const promise = new Promise((_, reject) => {
                reject('err')
            })
            const promise2 = promise.then(null, res => {
                return res
            })
            promise2
                .then(res => {
                    assert.equal(res, 'err')
                    return res + '!'
                })
                .then(res => {
                    assert.equal(res, 'err!')
                    done()
                })
        })

        it('2.2.7.1.2 success 的返回值是一个 Promise 实例', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const promise = new Promise(resolve => {
                resolve()
            })
            promise
                .then(() => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            cbs[0]()
                            resolve()
                        })
                    })
                })
                .then(cbs[1])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].called)
                assert(cbs[1].calledAfter(cbs[0]))
                done()
            }, 10)
        })

        it('2.2.7.1.2 success 的返回值是一个 Promise 实例，且失败了', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const promise = new Promise(resolve => {
                resolve()
            })
            promise
                .then(() => {
                    return new Promise((_, reject) => {
                        setTimeout(() => {
                            cbs[0]()
                            reject()
                        })
                    })
                })
                .then(null, cbs[1])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].called)
                assert(cbs[1].calledAfter(cbs[0]))
                done()
            }, 10)
        })

        it('2.2.7.1.2 fail 的返回值是一个 Promise 实例', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const promise = new Promise((_, reject) => {
                reject()
            })
            promise
                .then(null, () => {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            cbs[0]()
                            resolve()
                        })
                    })
                })
                .then(cbs[1])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].called)
                assert(cbs[1].calledAfter(cbs[0]))
                done()
            }, 10)
        })

        it('2.2.7.1.2 fail 的返回值是一个 Promise 实例，且失败了', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const promise = new Promise((_, reject) => {
                reject()
            })
            promise
                .then(null, () => {
                    return new Promise((_, reject) => {
                        setTimeout(() => {
                            cbs[0]()
                            reject()
                        })
                    })
                })
                .then(null, cbs[1])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].called)
                assert(cbs[1].calledAfter(cbs[0]))
                done()
            }, 10)
        })

        it('2.2.7.2 如果success抛出一个异常e,promise2 必须被拒绝', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const promise = new Promise(resolve => {
                resolve()
            })
            const err = new Error()
            const promise2 = promise.then(() => {
                throw err
            })
            promise2.then(cbs[0], cbs[1])
            setTimeout(() => {
                assert(cbs[0].notCalled)
                assert(cbs[1].calledWith(err))
                done()
            })
        })

        it('2.2.7.2 如果fail抛出一个异常e,promise2 必须被拒绝', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const promise = new Promise((_, reject) => {
                reject()
            })
            const err = new Error()
            const promise2 = promise.then(null, () => {
                throw err
            })
            promise2.then(cbs[0], cbs[1])
            setTimeout(() => {
                assert(cbs[0].notCalled)
                assert(cbs[1].calledWith(err))
                done()
            })
        })

        it('2.7.7.3', done => {
            const promise = new Promise(resolve => {
                resolve('hi')
            })
            const promise2 = promise.then(null)
            promise2.then(res => {
                assert.equal(res, 'hi')
                done()
            })
        })
    })

    describe('2.3.1 如果promise和x引用同一个对象，则用TypeError作为原因拒绝（reject）promise', () => {

        it('执行onFulfilled', done => {
            const p = Promise.resolve().then(() => {
                return p
            })
            p.then(null, reason => {
                assert(reason instanceof TypeError)
                done()
            })
        })

        it('执行onRejected', done => {
            const p = Promise.reject().then(null, () => {
                return p
            })
            p.then(null, reason => {
                assert(reason instanceof TypeError)
                done()
            })
        })
    })

    describe('2.3.3.1: Let `then` be `x.then', () => {

        it('`x` is an object with null prototype', done => {
            let numberOfTimesThenWasRetrieved = 0
            function xFactory() {
                return Object.create(null, {
                    then: {
                        get () {
                            ++numberOfTimesThenWasRetrieved
                            return onFulfilled => {
                                onFulfilled()
                            }
                        }
                    }
                });
            }
            const promise = new Promise(resolve => {
                resolve()
            })
            promise
                .then(() => {
                    return xFactory()
                })
                .then(() => {
                    assert.equal(numberOfTimesThenWasRetrieved, 1)
                    done()
                })
        })

        it('`x` is a function', done => {
            let numberOfTimesThenWasRetrieved = 0
            function xFactory() {
                function x () { }
                Object.defineProperty(x, 'then', {
                    get () {
                        ++numberOfTimesThenWasRetrieved
                        return onFulfilled => {
                            onFulfilled()
                        }
                    }
                })
                return x
            }
            const promise = new Promise(resolve => {
                resolve()
            })
            promise
                .then(() => {
                    return xFactory()
                })
                .then(() => {
                    assert.equal(numberOfTimesThenWasRetrieved, 1)
                    done()
                })
        })

        it('`y` is a thenable that fulfills but then throws', done => {
            function yFactory () {
                return {
                    then (onFulfilled) {
                        onFulfilled(111)
                        throw { a: 11 }
                    }
                }
            }
            function xFactory () {
                return {
                    then (resolvePromise) {
                        setTimeout(() => {
                            resolvePromise(yFactory())
                        }, 0)
                    }
                }
            }
            const promise = new Promise(resolve => {
                resolve()
            })
            promise
                .then(() => {
                    return xFactory()
                })
                .then(res => {
                    assert.equal(res, 111)
                    done()
                })
        })

        it('`y` is a thenable that tries to fulfill twice for an asynchronously-fulfilled custom thenable', done => {
            function outer (value) {
                return {
                    then (onFulfilled) {
                        onFulfilled(value)
                        onFulfilled(22222)
                    }
                }
            }
            function inner () {
                return {
                    then (onFulfilled) {
                        setTimeout(() => {
                            onFulfilled(111)
                        }, 0)
                    }
                }
            }
            const promise = new Promise(resolve => {
                resolve()
            })
            promise
                .then(() => {
                    return outer(inner())
                })
                .then(res => {
                    assert.equal(res, 111)
                    done()
                })
        })

        it('`y` is an already-fulfilled promise for a synchronously-fulfilled custom thenable `then` calls `resolvePromise` synchronously', done => {
            const p = new Promise((res) => {
                const obj = {
                    then (onFulfilled) {
                        onFulfilled(111)
                    }
                }
                res(obj)
            })
            const promise = new Promise(resolve => {
                resolve(333)
            })
            promise
                .then(() => {
                    return p
                })
                .then(res => {
                    assert.equal(res, 111)
                    done()
                })
        })
    })

    describe('2.3.3 如果then(success, fail) 中的 success 返回的x是个对象或者方法', () => {

        it('2.3.3.3 如果then是一个方法，把x当作this来调用它, thenable不继续', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const x = {
                then () {
                    cbs[0]()
                }
            }
            const promise = new Promise(resolve => {
                resolve()
            })
            const promise2 = promise.then(() => {
                return x
            })
            promise2.then(cbs[1])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].notCalled)
                done()
            })
        })

        it('2.3.3.3 如果then是一个方法，把x当作this来调用它, thenable继续', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const x = {
                then (res) {
                    res('hi')
                    cbs[0]()
                }
            }
            const promise = new Promise(resolve => {
                resolve()
            })
            const promise2 = promise.then(() => {
                return x
            })
            promise2.then(cbs[1])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].calledWith('hi'))
                assert(cbs[1].calledAfter(cbs[0]))
                done()
            })
        })

        it('2.3.3.3 如果then是一个方法，把x当作this来调用它, thenable继续，接收的参数是一个thenable', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const x = {
                then (res) {
                    const t = {
                        then (r) {
                            r('hi')
                        }
                    }
                    res(t)
                    cbs[0]()
                }
            }
            const promise = new Promise(resolve => {
                resolve()
            })
            const promise2 = promise.then(() => {
                return x
            })
            promise2.then(cbs[1])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].calledWith('hi'))
                assert(cbs[1].calledAfter(cbs[0]))
                done()
            })
        })

        it('2.3.3.3 如果then是一个方法，把x当作this来调用它, thenable被reject', done => {
            const cbs = [sinon.fake(), sinon.fake(), sinon.fake()]
            const x = {
                then (_, reject) {
                    reject('hi')
                    cbs[0]()
                }
            }
            const promise = new Promise(resolve => {
                resolve()
            })
            const promise2 = promise.then(() => {
                return x
            })
            promise2.then(cbs[1], cbs[2])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].notCalled)
                assert(cbs[2].calledWith('hi'))
                assert(cbs[2].calledAfter(cbs[0]))
                done()
            })
        })

        it('2.3.3.3 如果then不是一个方法，用x来完成promsie', done => {
            const cb = sinon.fake()
            const x = {
                x: '1',
                // then: 2,
                c: undefined
            }
            const promise = new Promise(resolve => {
                resolve()
            })
            const promise2 = promise.then(() => {
                return x
            })
            promise2.then(cb)
            setTimeout(() => {
                assert(cb.calledWith(x))
                done()
            })
        })

        it('2.3.4 如果x既不是对象也不是函数，用x完成promise', done => {
            const cb = sinon.fake()
            const x = 'hi'
            const promise = new Promise(resolve => {
                resolve()
            })
            const promise2 = promise.then(() => {
                return x
            })
            promise2.then(cb)
            setTimeout(() => {
                assert(cb.calledWith(x))
                done()
            })
        })
    })

    describe('2.3.3 如果then(success, fail) 中的 fail 返回的x是个对象或者方法', () => {

        it('2.3.3.3 如果then是一个方法，把x当作this来调用它, thenable不继续', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const x = {
                then () {
                    cbs[0]()
                }
            }
            const promise = new Promise((_, reject) => {
                reject()
            })
            const promise2 = promise.then(null, () => {
                return x
            })
            promise2.then(null, cbs[1])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].notCalled)
                done()
            })
        })

        it('2.3.3.3 如果then是一个方法，把x当作this来调用它, thenable继续', done => {
            const cbs = [sinon.fake(), sinon.fake()]
            const x = {
                then (res) {
                    res('hi')
                    cbs[0]()
                }
            }
            const promise = new Promise((_, reject) => {
                reject()
            })
            const promise2 = promise.then(null, () => {
                return x
            })
            promise2.then(cbs[1])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].calledWith('hi'))
                assert(cbs[1].calledAfter(cbs[0]))
                done()
            })
        })

        it('2.3.3.3 如果then是一个方法，把x当作this来调用它, thenable被reject', done => {
            const cbs = [sinon.fake(), sinon.fake(), sinon.fake()]
            const x = {
                then (_, reject) {
                    reject('hi')
                    cbs[0]()
                }
            }
            const promise = new Promise((_, reject) => {
                reject()
            })
            const promise2 = promise.then(null, () => {
                return x
            })
            promise2.then(cbs[1], cbs[2])
            setTimeout(() => {
                assert(cbs[0].called)
                assert(cbs[1].notCalled)
                assert(cbs[2].calledWith('hi'))
                assert(cbs[2].calledAfter(cbs[0]))
                done()
            })
        })

        it('2.3.3.3 如果then不是一个方法，用x来完成promsie', done => {
            const cb = sinon.fake()
            const x = {
                x: '1',
                then: 2,
                c: undefined
            }
            const promise = new Promise((_, reject) => {
                reject()
            })
            const promise2 = promise.then(null, () => {
                return x
            })
            promise2.then(cb)
            setTimeout(() => {
                assert(cb.calledWith(x))
                done()
            })
        })

        it('2.3.4 如果x既不是对象也不是函数，用x完成promise', done => {
            const cb = sinon.fake()
            const x = 'hi'
            const promise = new Promise((_, reject) => {
                reject()
            })
            const promise2 = promise.then(null, () => {
                return x
            })
            promise2.then(cb)
            setTimeout(() => {
                assert(cb.calledWith(x))
                done()
            })
        })

        it('2.3.4 如果x是Object.create(Function.prototype)', done => {
            const x = {
                then: Object.create(Function.prototype)
            }
            const promise = new Promise(resolve => {
                resolve()
            })
            promise
                .then(res => {
                    return x
                })
                .then(res => {
                    assert.deepEqual(x, res)
                    done()
                })
        })
    })

    it('Promise.resolve', done => {
        const res = Promise.resolve(11)
        res
            .then(res => {
                assert.equal(res, 11)
                return res - 1
            })
            .then(res => {
                assert.equal(res, 10)
                return res - 1
            })
            .then(res => {
                assert.equal(res, 9)
                done()
            })
    })

    it('Promise.reject', done => {
        const res = Promise.reject(11)
        res
            .then(null, res => {
                assert.equal(res, 11)
                return res - 1
            })
            .then(res => {
                assert.equal(res, 10)
                return res - 1
            })
            .then(res => {
                assert.equal(res, 9)
                done()
            })
    })
})