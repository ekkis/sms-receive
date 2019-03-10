const fetch = require('node-fetch');
var HTML = require('node-html-parser');

var self = module.exports = {
	numbers: async () => {
		var s = await fetch('https://receive-smss.com')
			.then(res => res.text());
		var html = HTML.parse(s);
		
		var nbr = find(html, 'number-boxes-item-number')
			.map(o => o.childNodes[0].rawText);
		var loc = find(html, 'number-boxes-item-country')
			.map(o => o.childNodes[0].rawText);

		var ls = [];
		for (var i = 0; i < nbr.length; i++)
			ls.push({loc: loc[i], nbr: nbr[i]});
		return ls;
	},
	messages: async (receiver) => {
		var url = 'https://receive-smss.com/sms/' + receiver;
		var s = await fetch(url).then(res => res.text());
		var html = HTML.parse(s);
		var cells = find(html, 'wrpcel')
			.map(o => o.childNodes[0].rawText);

		var ret = [];
		for (var i = 0; i < cells.length; i += 3) {
			var o = {sender: cells[i], message: cells[i+1], time: cells[i+2]};
			ret.push(o);
		}
		return ret;
	},
	check: async (sender, re, receiver) => {
		var ls = await self.messages(receiver);
		for (var o of ls) {
			if (o.sender == sender && o.message.match(re))
				return true;
		}
		return false;
	},
	watch: (cfg) => {
		var count = cfg.count || 3;
		var id = setInterval(chk, cfg.delay || 5000);
		async function chk() {
			var res = await self.check(cfg.sender, cfg.re, cfg.receiver);
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

self.messages('19893043244').then(console.log);
