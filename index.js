const fetch = require('node-fetch');
var HTML = require('node-html-parser');
var PNL = require('phonenumberlite');

var cache = {};
var config = {
	fetch: (url, opts) => fetch(url, opts).then(res => res.text())
}
var self = module.exports = {
	config: opts => { Object.assign(config, opts) },
	fetch: async () => {
		var s = await config.fetch('https://receive-smss.com');
		var html = HTML.parse(s);
		
		var nbr = find(html, 'number-boxes-item-number')
			.map(o => o.childNodes[0].rawText);
		var loc = find(html, 'number-boxes-item-country')
			.map(o => o.childNodes[0].rawText);
		var stat = find(html, 'number-boxes-item-button')
			.map(o => o.childNodes[0].rawText);

		var ls = [];
		for (var i = 0; i < nbr.length; i++) {
			if (stat[i] != 'Open') continue;
			var nn = PNL.parse(nbr[i]);
			ls.push({loc: loc[i], nbr: nn.internationalFormat});
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
		var url = 'https://receive-smss.com/sms/' + receiver;
		var s = await config.fetch(url);
		var html = HTML.parse(s);
		var cells = find(html, 'wrpcel')
			.map(o => (o.childNodes[0] || {}).rawText);

		var ret = [];
		for (var i = 0; i < cells.length; i += 3) {
			var o = {sender: cells[i], message: cells[i+1], time: cells[i+2]};
			ret.push(o);
		}
		return ret;
	},
	check: async (receiver, sender, re) => {
		var ls = await self.messages(receiver);
		ls = ls.filter(o => o.sender == sender && o.message.match(re));
		return ls.length > 0;
	},
	watch: (cfg) => {
		var count = cfg.count || 6;
		var id = setInterval(chk, 'delay' in cfg ? cfg.delay : 5 * 60 * 1000);
		async function chk() {
			var res = await self.check(cfg.receiver, cfg.sender, cfg.re);
			if (res || --count <= 0) {
				clearInterval(id);
				cfg.callback(res);
			}
		}
	}
};

function find(html, sel) {
	var ret = [];
	if (html.classNames && html.classNames.filter(s => s.match(sel)).length > 0) 
		ret.push(html);
	for (var o of html.childNodes)
		ret = ret.concat(find(o, sel));
	return ret;
}

Array.prototype.unique = function() { 
    return this.filter((e, pos) => this.indexOf(e) == pos);
}