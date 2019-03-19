const sms = require('./index.js');
sms.numbers().then(console.log).catch(console.log);
sms.countries().then(console.log).catch(console.log);
