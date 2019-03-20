const assert = require('assert').strict
const sms = require('../index.js')

describe('sms-receive', () => {
    describe('Numbers', () => {
        var actual;
        before(async () => {
            actual = await sms.numbers();
        })
        it('Should return multiple choices', async () => {
            assert.notEqual(actual.length, 0, 'No numbers found')
        })
        it('Records should have number and location', async () => {
            assert.ok(actual[0].nbr, 'No number returned')
            assert.ok(actual[0].loc, 'No location returned')
        })
        it('Numbers should be properly formatted', async () => {
            assert.ok(!actual[0].nbr.match(/^\+$/), 'Does not begin with a +')
            assert.ok(actual[0].nbr.match(/^\+[\d ]+$/), 'Contains unsupported characters')
        })    
    })
    describe('Countries', () => {
        var ls;
        before(async () => {
            ls = await sms.countries()
        })
        it('Is non-empty array', () => {
            assert.ok(Array.isArray(ls), 'Is not an array')
            assert.ok(ls.length > 0, 'Array is empty')
        })
        it('Contains a distinct list', () => {
            var found = false;
            for (var i = 0; i < ls.length; i++)
                if (ls.indexOf(ls[i]) != i) {
                    found = true; break;
                }
            assert.ok(!found, 'Array is not distinct')
        })
    })
})