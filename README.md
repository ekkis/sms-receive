# SMS Receive

A package that allows the caller to extract SMS messages sent to public numbers
published by the http://receive-smss.com service

One usecase this functionality serves is phone number verification

Whilst typically this is accomplished by sending the user's phone number a unique code
that must then be entered into a web page, because sending costs but receiving
is free, the procedure can be reversed.  Give the user a phone number from the 
list of public numbers available from via this service, and a unique code or
keyword, and then when the user texts the given code, his number can be verified

## Installation
```
npm install sms-receive --save
```

## Loading the module

In the usual manner, simply require the package:
```
const sms = require('sms-receive');
```

## API

### numbers()

Returns an array of objects comprising phone numbers available for receipt of
messages, and the countries where these ar located e.g.
```
[{
	loc: 'United States',
	nbr: '+1 2015471451'
}]
```
### messages(sender, regexp, receiver)
* `sender` the phone number expected to send a message
* `regexp` a regular expression used to find a match
* `receiver` the receiving phone number to inspect

Retrieves a list of the messages recently sent to the given receiver by various
senders.  This list shifts across time as the service expires old messages.  The
objects returned comprise a sender phone number, the message, and a time offset
when the message was sent e.g.
```
[{
	sender: '19852502821',
	message: 'Use 428210 como seu codigo de login para o Tinder. (Account Kit by Facebook)',
	time: '2 minutes ago'
}]
```
### check(sender, regexp, receiver)
* `sender` specifies the phone number sending the message
* `regexp` is a regular expression used to match against messages received
* `receiver` indicates which phone number to watch for sent messages

The method checks the site for messages sent to the receiver by the sender
matching the given regular.  A true/false value is returned indicating whether
the regular expressions matched against any message
### watch(cfg)
* `sender`, `receiver`, `regexp` -- as used in `check()` above
* `count` the number of times to poll (default: 3 times)
* `delay` the interval between polls, specified in milliseconds (default: 5000ms)
* `callback` the method to call when the watch completes

The method polls the page for a desired the match a `count` number of times,
waiting `delay` number of miliseconds in between polls.  The `callback` method
is called whenever either: 1) a match is found (the callback is passed a true
value) or, 2) the number of attempts expires (the callback is handed a false)

## Examples

The examples below use the promise call-style but the async/await
paradigm can also be used:

```
# as a promise
sms.numbers().then(console.log);

# async/await
(async () => {
    var ls = await sms.numbers();
    console.log(ls);
})();
```
which produces a list similar to the following:

> [ { loc: 'United States', nbr: '+1 2015471451' },
> { loc: 'United States', nbr: '+1 6102851642' },
> { loc: 'Canada', nbr: '+1 2264751261' },
> { loc: 'Canada', nbr: '+1 2262421899' },
> { loc: 'France', nbr: '+33 644633194' },
> { loc: 'United Kingdom', nbr: '+44 7520632916' },
> { loc: 'Sweden', nbr: '+46 769436478' },
> { loc: 'Poland', nbr: '+48 732232809' } ]

Supposing the first number in the list is provided to your user, the list of
messages sent to that number may be retrieved like this:
```
sms.messages('12015471451').then(console.log);
```
producing something like:

> [ { sender: '19852502821',
>    message:
>     'Use 428210 como seu codigo de login para o Tinder. (Account Kit by Facebook)',
>    time: '2 minutes ago' },
>  { sender: '19852502821',
>    message:
>     'Use 771145 as your login code for Smule. (Account Kit by Facebook)',
>    time: '13 minutes ago' },

Or the page can be checked for the sender to post a specific value (like a code):
```
sms.check('19852502821', /Use 428210/, '12015471451')
    .then(res => console.log(res ? 'CODE SENT': 'CODE NOT YET SENT'));
```
And the page can also be watched.  The example below expires after 3 times,
with 3 second waits in between:
```
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
