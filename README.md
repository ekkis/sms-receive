# SMS Receive

A package that allows the caller to extract SMS messages sent to public numbers
published by the http://receive-smss.com service

One usecase this functionality serves is phone number verification

Whilst typically this is accomplished by sending the user's phone number a unique code
that must then be entered into a web page, because sending costs but receiving
is free, the procedure can be reversed.  Give the user a phone number from the 
list of public numbers available from via this service, and a unique code or
keyword, and then when the user texts the given code, his number can be verified

## Install
Add to your project from the NPM repository:
```
npm install sms-receive --save
```
and grab an instance:
```javascript
// using ES6  modules
import sms from 'sms-receive';

// using CommonJS modules
const sms = require('sms-receive');
```

## Usage

The following methods are available

### numbers()

Returns an array of objects comprising phone numbers available for receipt of
messages, and the countries where these are located e.g.
```javascript
[{
    loc: 'United States',
    nbr: '+1 2015471451'
}]
```
### numbers(country)

If a country name is passed to this method, a list of phone numbers available
for that country are returned e.g.
```javascript
['+1 2015471451', '+1 8185551212', '+1 2128880000']
```
### countries()

A list of the countries for which phone numbers are available is returned e.g.
```javascript
['France', 'Sweden', 'United States']
```

### messages(sender, regexp, receiver)
* `sender` the phone number expected to send a message
* `regexp` a regular expression used to find a match
* `receiver` the receiving phone number to inspect

Retrieves a list of the messages recently sent to the given receiver by various
senders.  This list shifts across time as the service expires old messages.  The
objects returned comprise a sender phone number, the message, and a time offset
when the message was sent e.g.
```javascript
[{
    sender: '+19852502821',
    message: 'Use 428210 como seu codigo de login para o Tinder. (Account Kit by Facebook)',
    time: '2 minutes ago'
}]
```

### check(receiver, sender, regexp)
* `receiver` indicates which phone number to watch for sent messages
* `sender` specifies the phone number sending the message
* `regexp` is a regular expression used to match against messages received

The method checks the site for messages sent to the receiver by the sender
matching the given regular.  A true/false value is returned indicating whether
the regular expressions matched against any message

### watch(cfg)
* `receiver`, `sender`, `regexp` -- as used in `check()` above
* `count` the number of times to poll (default: 6 times)
* `delay` the interval between polls, specified in milliseconds (default: 5min)
* `callback` the method to call when the watch completes

The method polls the page for a desired the match a `count` number of times,
waiting `delay` number of miliseconds in between polls.  The `callback` method
is called whenever either: 1) a match is found (the callback is passed a true
value) or, 2) the number of attempts expires (the callback is handed a false)

A watch can be made eternal by setting `count: -1` and must thus be cancelled by
making a niladic call: `.watch()`.  The interval id is returned to the caller
when the watch is first set up

### fetch()

Used to fetch the main directory of available numbers.  It is unnecessary to call
this method as it is automatically called by other methods in the module, but it 
can be used to force-fetch a list of numbers

### config(o)
* fetch - specifies a function that can fetch a url and returns text
* number - specifies the class name to look for numbers for within the HTML
* country - (see above)
* button - (see above)
* message - (see above)

By default the module uses `node-fetch` but this dependency can be injected
using this mechanism.  The requirements for the provided function are the it
must accept a `url` and and `opts` object, and must return text wrapped in a
promise

The website may from time to time change the class names used to identify parts
of the contents.  If this happens the module will stop returning data.  The suggestion
is to run the integration tests and if those fail, investigate what the new class
names are.  Then configure like this:

```js
// this fixes the module to work again.  obviously some developer renamed the
// class with a double-m 
sms.config({number: 'number-boxes-itemm-number'});
```

## Examples

The examples below use the promise call-style but the async/await
paradigm can also be used:

```javascript
// as a promise
sms.numbers().then(console.log);

// async/await
(async () => {
    console.log(await sms.numbers());
})();
```
which produces a list similar to the following:

```javascript
[
  { loc: 'United States', nbr: '+1 989-304-3244' },
  { loc: 'Canada', nbr: '+1 226-475-1261' },
  { loc: 'France', nbr: '+33 6 44 63 33 89' },
  { loc: 'United Kingdom', nbr: '+44 75 2063 2670' },
  { loc: 'United Kingdom', nbr: '+44 7520 660692' },
  { loc: 'Sweden', nbr: '+46 765 19 53 49' },
  { loc: 'Poland', nbr: '+48 73 210 49 26' },
]
```
Supposing the first number in the list is provided to your user, the list of
messages sent to that number may be retrieved like this:
```javascript
sms.messages('12015471451').then(console.log);
```
producing something like:
```javascript
[
  {
     sender: '19852502821',  
     message: 'Use 428210 como seu codigo de login para o Tinder.',  
     time: '2 minutes ago'
  },  
  {
     sender: '19852502821',  
     message: 'Use 771145 as your login code for Smule',  
     time: '13 minutes ago'
  }
]  
```
Or the page can be checked for the sender to post a specific value (like a code):
```javascript
sms.check('19852502821', /Use 428210/, '12015471451')
    .then(res => console.log(res ? 'CODE SENT': 'CODE NOT YET SENT'));
```
And the page can also be watched.  The example below expires after 3 times,
with 3 second waits in between:
```javascript
self.watch({
    sender: '19852502821',
    receiver: '12015471451',
    re: /Use 428210/,
    count: 3,
    delay: 3000,
    callback: res => { console.log(res ? 'FOUND' : 'FAILED'); }
});
```
## Licence
ISC

## Support

For support post an issue on Github or reach out to me on Telegram.
My username is [@ekkis](https://t.me/ekkis)
