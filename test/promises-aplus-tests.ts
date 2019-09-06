import Promise from '../src/index'

describe('Promises/A+ Tests', () => {
    // @ts-ignore
    require('promises-aplus-tests').mocha(Promise)
})
