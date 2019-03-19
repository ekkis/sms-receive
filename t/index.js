const assert = require('assert').strict
const sms = require('../index.js')

describe('sms-receive', () => {
    it('Should return multiple numbers', async () => {
        var actual = await sms.numbers()
        assert.notEqual(actual.length, 0, 'No numbers found')
    })
    it('Records should have number and location', async () => {
        var actual = await sms.numbers()
        assert.ok(actual[0].nbr, 'No number returned')
        assert.ok(actual[0].loc, 'No location returned')
    })
    it('Numbers should be properly formatted', async () => {
        var actual = await sms.numbers()
        assert.ok(!actual[0].nbr.match(/^\+$/), 'Does not begin with a +')
        assert.ok(actual[0].nbr.match(/^\+[\d ]+$/), 'Contains unsupported characters')
    })
    it('Returns countries', async () => {
        let ls = await sms.countries();
        assert.ok(Array.isArray(ls), 'Is not an array')
        assert.ok(ls.length > 0, 'Array is empty')
        var found = false;
        for (var i = 0; i < ls.length; i++)
            if (ls.indexOf(ls[i]) != i) {
                found = true; break;
            }
        assert.ok(!found, 'Array is distinct')
    })
})