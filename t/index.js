const fs = require('fs')
const assert = require('assert').strict
const sms = require('../index.js')

// integration tests must be run first because the dependency
// injection needed for the unit tests cannot be undone

describe('Integration tests', function () {
    this.timeout(5000); // the site is a bit slow somtimes and exceeds the mocha timeout

    describe('Numbers', () => {
        var actual;
        before(async () => {
            sms.config({number: 'number-boxes-itemm-number'})
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
            assert.ok(actual[0].nbr.match(/^\+/), 'Does not begin with a +')
            assert.ok(actual[0].nbr.match(/[\D +]/), 'Contains unsupported characters')
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
    describe('Messages', () => {
        it('Fetches properly', async () => {
            var nbrs = await sms.numbers()
            var msgs = await sms.messages(nbrs[0].nbr)
            assert.ok(Array.isArray(msgs), 'Is not an array')
            assert.ok(msgs.length > 0, 'Array is empty for [' + nbrs[0].nbr + ']')
            assert.ok('sender' in msgs[0], 'Containts sender')
            assert.ok('message' in msgs[0], 'Containts message')
        })
    })
})
describe('Unit tests', () => {
    describe('Numbers', () => {
        before(() => {
            sms.config({
                fetch: () => Promise.resolve(fs.readFileSync('t/nbrs.html', 'utf8'))
            })
            return sms.fetch()
        })
        it('Catalogue', async () => {
            var actual = await sms.numbers()
            var expected = [
                { loc: 'United States', nbr: '+1 989-304-3244' },
                { loc: 'United States', nbr: '+1 470-655-1642' },
                { loc: 'United States', nbr: '+1 610-285-1642' },
                { loc: 'Canada', nbr: '+1 226-475-1261' },
                { loc: 'Canada', nbr: '+1 778-786-8717' },
                { loc: 'Canada', nbr: '+1 226-242-1899' },
                { loc: 'France', nbr: '+33 6 44 63 33 89' },
                { loc: 'France', nbr: '+33 6 44 63 42 12' },
                { loc: 'France', nbr: '+33 6 44 63 31 94' },
                { loc: 'United Kingdom', nbr: '+44 75 2063 2670' },
                { loc: 'United Kingdom', nbr: '+44 7520 660692' },
                { loc: 'United Kingdom', nbr: '+44 752 063 2916' },
                { loc: 'Sweden', nbr: '+46 765 19 53 49' },
                { loc: 'Sweden', nbr: '+46 769 43 64 78' },
                { loc: 'Poland', nbr: '+48 73 210 49 26' },
                { loc: 'Poland', nbr: '+48 73 223 28 09' }
            ];
        
            assert.deepEqual(actual, expected)
        })
        it('Countries', async () => {
            var actual = await sms.countries()
            var expected = [
                'Canada',
                'France',
                'Poland',
                'Sweden',
                'United Kingdom',
                'United States'
            ];

            assert.deepEqual(actual, expected)
        })
    })
    describe('Messages', () => {
        before(() => {
            sms.config({
                fetch: () => Promise.resolve(fs.readFileSync('t/msgs.html', 'utf8'))
            })
            return sms.fetch()
        })
        it('Returns correct list', async () => {
            var actual = await sms.messages()
            var expected = [ 
                { sender: '17742201178', message: 'Use 310637 as your login code for Tinder', time: '3 minutes ago' },
                { sender: '17742201178', message: 'Use 531917 as your login code for Yubo', time: '3 minutes ago' },
                { sender: '12135168202', message: 'Your Tinder code is 721578', time: '6 minutes ago' },
                { sender: '17025003695', message: 'PayPal: Responda con su codigo. CODIGO: 303072', time: '7 minutes ago' },
                { sender: '16787723168', message: 'BoxyPay Alert: Please NOTE that ...', time: '18 minutes ago' },
                { sender: '12135168202', message: 'Your Tinder code is 071915', time: '2 hours ago' } 
            ]
            assert.deepEqual(actual, expected)
        })
        it('Checks for code correctly', async () => {
            var actual = await sms.check('', '17742201178', /310637/);
            assert.ok(actual == true, 'Failed to find code')
            actual = await sms.check('', '12135168202', /310637/);
            assert.ok(actual == false, 'Found code when it shouldn\'t')
        })
        it('Adjusts for formatted numbers', async () => {
            var actual = await sms.check('', '+17742201178', /310637/);
            assert.ok(actual == true, 'Failed with initial +')
            actual = await sms.check('', '+1 774-220-1178', /310637/);
            assert.ok(actual == true, 'Failed with dashes and spaces')
        })
        it('Handles numbers as integers', async () => {
            var actual = await sms.check('', 17742201178, /310637/);
            assert.ok(actual == true, 'Failed with initial +')
        })
        it('Watch succeeds', (done) => {
            sms.watch({
                sender: '17742201178', 
                re: /310637/, 
                delay: 0,
                callback: (res) => { done(); return res; }
            })
        })
    })
})