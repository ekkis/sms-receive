const fs = require('fs')
const assert = require('assert').strict
const sms = require('../index.js')

const Timeout = (() => {
    var id = setInterval(() => null, 0);
    clearInterval(id);
    return id.constructor;
})()

// integration tests must be run first because the dependency
// injection needed for the unit tests cannot be undone

describe('Integration tests', function () {
    this.timeout(5000); // the site is a bit slow somtimes and exceeds the mocha timeout

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
                { loc: 'United States', nbr: '+1 646-266-2535' },
                { loc: 'Canada', nbr: '+1 646-258-7043' },
                { loc: 'France', nbr: '+33 7 52 12 60 47' },
                { loc: 'France', nbr: '+33 7 52 12 45 46' },
                { loc: 'Germany', nbr: '+49 15 207831169' },
                { loc: 'Germany', nbr: '+49 152 07829731' },
                { loc: 'Germany', nbr: '+49 1520 7829823' },
                { loc: 'United Kingdom', nbr: '+44 7716 885603' },
                { loc: 'United Kingdom', nbr: '+44 7533 398730' },
                { loc: 'United Kingdom', nbr: '+44 7503 402851' },
                { loc: 'United Kingdom', nbr: '+44 7510 080109' },
                { loc: 'United Kingdom', nbr: '+44 7510 080146' },
                { loc: 'United Kingdom', nbr: '+44 7533 403149' },
                { loc: 'United Kingdom', nbr: '+44 7503 402850' },
                { loc: 'United Kingdom', nbr: '+44 7510 080141' },
                { loc: 'United Kingdom', nbr: '+44 7510 080125' },
                { loc: 'United Kingdom', nbr: '+44 7309 917830' },
                { loc: 'Russian Federation', nbr: '+7 921 162-96-74' },
                { loc: 'Russian Federation', nbr: '+7 921 167-95-62' },
                { loc: 'Russian Federation', nbr: '+7 921 167-96-65' },
                { loc: 'Ukraine', nbr: '+380 9324 85981' },
                { loc: 'Poland', nbr: '+48 727 842 536' },
                { loc: 'Poland', nbr: '+48 722 717 428' },
                { loc: 'Netherlands', nbr: '+31 6 47264567' },
                { loc: 'India', nbr: '+91 7428 723 247' },
                { loc: 'India', nbr: '+91 7428 730 894' },
                { loc: 'India', nbr: '+91 742 873 1210' },
                { loc: 'Israel', nbr: '+972 55-260-3210' },
                { loc: 'Kazakhstan', nbr: '+7 778 949 0683' },
                { loc: 'Thailand', nbr: '+66 95 396 1043' },
                { loc: 'Thailand', nbr: '+66 88 623 1091' }
            ];

            assert.deepEqual(actual, expected)
        })
        it.skip('Bad number', async () => {
            // need to figure out how to test badly formatted numbers
            // e.g. +7755722696, which should be +77755722696
        })
        it('Countries', async () => {
            var actual = await sms.countries()
            var expected = [
                'Canada',
                'France',
                'Germany',
                'India',
                'Israel',
                'Kazakhstan',
                'Netherlands',
                'Poland',
                'Russian Federation',
                'Thailand',
                'Ukraine',
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
                { "sender": "12066908413", "message": "\ncraigslist secret code for JOSHHART79@HOTMAIL.COM is 93931. Do not share this code for any reason. Any request for it is a scam.\n", "time": 7 }, 
                { "sender": "13856007183", "message": "\nYour Fetch one-time security code is 844129. (Expires in 10 minutes.)\n@fetchrewards.com\n", "time": 18 }, 
                { "sender": "6245", "message": "\nadmin@postalusa.org / USPS / Dear Custoumer,\nUSPS informs you that Your shipment that Your shipment\nis still waiting for instructions from you, co\n", "time": 28 }, 
                { "sender": "22395", "message": "\nYour SIGNAL verification code is: 519048\n", "time": 44 }, 
                { "sender": "72975", "message": "\nPayPal: 971844 is your security code. Don't share your code.\n", "time": 60 }, 
                { "sender": "72975", "message": "\nPayPal: 971844 is your security code. Don't share your code.\n", "time": 60 }, 
                { "sender": "86753", "message": "\n6148 is your Venmo phone verification code. Enter it at venmo.com or in the Venmo app to verify your account.\n", "time": 120 }
            ]

            assert.deepEqual(actual, expected)
        })
        it('Checks for code correctly', async () => {
            var actual = await sms.check('', '22395', /519048/);
            assert.ok(actual == true, 'Failed to find code')
            actual = await sms.check('', '12135168202', /310637/);
            assert.ok(actual == false, 'Found code when it shouldn\'t')
        })
        it('Adjusts for formatted numbers', async () => {
            var actual = await sms.check('', '+12066908413', /93931/);
            assert.ok(actual == true, 'Failed with initial +')
            actual = await sms.check('', '+1 206-690-8413', /93931/);
            assert.ok(actual == true, 'Failed with dashes and spaces')
        })
        it('Handles numbers as integers', async () => {
            var actual = await sms.check('', '12066908413', /93931/);
            assert.ok(actual == true, 'Failed without initial +')
        })
        it('Watch succeeds', (done) => {
            sms.watch({
                sender: '17742201178',
                re: /310637/,
                delay: 0,
                callback: (res) => { done(); return res; }
            })
        })
        it('Watch cancellation succeeds', (done) => {
            var id = sms.watch({
                sender: '17742201178',
                re: /310X37/,
                count: -1,
                delay: 500,
                callback: (res) => { return res; }
            })
            assert.ok(id instanceof Timeout)
            sms.watch()
            done()
        })
    })
})