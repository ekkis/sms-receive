const fetch = require('node-fetch');
var HTML = require('node-html-parser');
var PNL = require('phonenumberlite');

var cache = {};
var config = {
	fetch: (url, opts) => {
		// Pages for specific phone numbers require cookies set by a previous visit, so save them.
		if (cache.cookie) {
			if (!opts) opts = {};
			if (!opts.headers) opts.headers = {};
			Object.assign(opts.headers, { 'cookie': cache.cookie });
		}
		return fetch(url, opts).then(res => {
			cache.cookie = res.headers.get('set-cookie');
			return res.text();
		});
	},
	number: 'number-boxes-itemm-number',
	country: 'number-boxes-item-country',
	button: 'number-boxes1-item-button',
	message: 'wr3pc333el1878'
}
var self = module.exports = {
	config: opts => { Object.assign(config, opts) },
	fetch: async () => {
		var s = await config.fetch('https://receive-smss.com');
		var html = HTML.parse(s);

		var nbr = getText(html, config.number);
		var loc = getText(html, config.country);
		var stat = getText(html, config.button);

		var ls = [];
		for (var i = 0; i < nbr.length; i++) {
			if (stat[i] != 'Open') continue;
			var nn = PNL.parse(nbr[i]);
			if (!nn) {
				console.log('WARNING: ' + nbr[i] + ' failed to parse!')
				continue
			}
			ls.push({ loc: loc[i], nbr: nn.internationalFormat });
		}

		return cache.numbers = ls;
	},
	numbers: async (country) => {
		var ls = cache.numbers || await self.fetch();
		return (country)
			? ls.filter(o => o.loc == country).map(o => o.nbr)
			: ls;
	},
	countries: async () => {
		var ls = cache.numbers || await self.fetch();
		return ls.map(o => o.loc).sort().unique();
	},
	messages: async (receiver) => {
		var url = 'https://receive-smss.com/sms/' + clean(receiver);
		var s = await config.fetch(url);
		var html = HTML.parse(s);
		var cells = getText(html, config.message);
		var ret = [];
		for (var i = 0; i < cells.length; i += 3) {
			var o = {
				sender: clean(cells[i]),
				message: cells[i + 1],
				time: cells[i + 2].replace(/[()]/g, '') // remove parens from "(2 minutes) ago"
			};
			ret.push(o);
		}
		return ret;
	},
	check: async (receiver, sender, re) => {
		sender = clean(sender);
		var ls = await self.messages(receiver);
		ls = ls.filter(o => clean(o.sender) == sender && o.message.match(re));
		return ls.length > 0;
	},
	watch: (cfg) => {
		if (!cfg && cache.watcher) {
			clearInterval(cache.watcher);
			return cache.watcher = undefined;
		}
		var count = cfg.count || 6;
		cache.watcher = setInterval(chk, 'delay' in cfg ? cfg.delay : 5 * 60 * 1000);
		async function chk() {
			var res = await self.check(cfg.receiver, cfg.sender, cfg.re);
			if (res || --count == 0) {
				clearInterval(cache.watcher);
				cfg.callback(res);
			}
		}
		return cache.watcher;
	}
};

function getText(html, className) {
	return html.querySelectorAll('.' + className)
		.map(node => node.rawText);
}

function clean(nbr) {
	var t = typeof nbr;
	if (t == 'number') nbr = nbr.toString();
	if (t == 'object') throw new Error('Cannot clean objects');
	return (nbr || '').replace(/\D/g, '');
}

Array.prototype.unique = function () {
	return this.filter((e, pos) => this.indexOf(e) == pos);
}
