const { execFile } = require('child_process');
const { promisify } = require('util');
var HTML = require('node-html-parser');

const execFileAsync = promisify(execFile);

var cache = {};
var config = {
	fetch: async (url, opts) => {
		var args = ['-sSL', url];
		var headers = Object.assign({
			'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
			'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
			'accept-language': 'en-US,en;q=0.9',
			'upgrade-insecure-requests': '1'
		}, opts && opts.headers);

		Object.keys(headers).forEach(name => {
			args.push('-H', name + ': ' + headers[name]);
		});

		var res = await execFileAsync('curl', args);
		return res.stdout;
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

		var nbr = getText(html, config.number).map(s => s.trim());
		var loc = getText(html, config.country).map(s => s.trim());
		var stat = getText(html, config.button).map(s => s.trim());

		var ls = [];
		for (var i = 0; i < nbr.length; i++) {
			if (stat[i] != 'Open') continue;
			var formatted = formatNumber(nbr[i], loc[i]);
			if (!formatted) {
				console.log('WARNING: ' + nbr[i] + ' failed to parse!')
				continue
			}
			ls.push({ loc: loc[i], nbr: formatted });
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
		var rows = html.querySelectorAll('.message_details');
		if (rows.length) {
			return rows.map(row => {
				var sender = row.querySelector('.senderr a, .senderr');
				var message = row.querySelector('.msgg span');
				var time = row.querySelector('.time');
				return {
					sender: clean(sender && sender.rawText),
					message: message ? message.rawText : '',
					time: getSeconds(time ? time.rawText : '')
				};
			});
		}
		var cells = getText(html, config.message);
		var ret = [];
		for (var i = 0; i < cells.length; i += 3) {
			var o = {
				sender: clean(cells[i]),
				message: cells[i + 1],
				time: getSeconds(cells[i + 2])
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

function getSeconds(s) {
	var n = Number(s.match(/\d+/)[0])
	if (s.match(/minute/)) n *= 60
	if (s.match(/hour/)) n *= 60*60
	return n
}

function clean(nbr) {
	var t = typeof nbr;
	if (t == 'number') nbr = nbr.toString();
	if (t == 'object') throw new Error('Cannot clean objects');
	return (nbr || '').replace(/\D/g, '');
}

function formatNumber(nbr, country) {
	var digits = clean(nbr);
	if (!digits) return '';

	var masks = {
		'United States': {
			default: [1, 3, '-', 3, '-', 4]
		},
		'Canada': {
			default: [1, 3, '-', 3, '-', 4]
		},
		'France': {
			default: [2, 1, 2, 2, 2, 2]
		},
		'Germany': {
			'4915207831169': [2, 2, 9],
			'4915207829731': [2, 3, 8],
			'4915207829823': [2, 4, 7]
		},
		'United Kingdom': {
			default: [2, 4, 6]
		},
		'Russian Federation': {
			'79211629674': [1, 3, 3, '-', 2, '-', 2],
			'79211679562': [1, 3, 3, '-', 2, '-', 2],
			'79211679665': [1, 3, 3, '-', 2, '-', 2]
		},
		'Ukraine': {
			default: [3, 4, 5]
		},
		'Poland': {
			default: [2, 3, 3, 3]
		},
		'Netherlands': {
			default: [2, 1, 8]
		},
		'India': {
			'917428723247': [2, 4, 3, 3],
			'917428730894': [2, 4, 3, 3],
			'917428731210': [2, 3, 3, 4]
		},
		'Israel': {
			default: [3, 2, '-', 3, '-', 4]
		},
		'Kazakhstan': {
			default: [1, 3, 3, 4]
		},
		'Thailand': {
			default: [2, 2, 3, 4]
		}
	};

	var mask = masks[country];
	if (!mask) return '+' + digits;
	if (typeof mask == 'object' && !Array.isArray(mask)) mask = mask[digits] || mask.default;
	if (!mask) return '+' + digits;
	return '+' + applyMask(digits, mask);
}

function applyMask(digits, mask) {
	var parts = [];
	var pos = 0;
	for (var i = 0; i < mask.length; i++) {
		if (typeof mask[i] == 'string') {
			parts.push(mask[i]);
			continue;
		}
		parts.push(digits.slice(pos, pos + mask[i]));
		pos += mask[i];
	}
	if (pos < digits.length) parts.push(' ' + digits.slice(pos));
	return parts.join(' ').replace(/ - /g, '-').trim();
}

Array.prototype.unique = function () {
	return this.filter((e, pos) => this.indexOf(e) == pos);
}
