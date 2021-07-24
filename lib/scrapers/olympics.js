const htmlParser = require("cheerio");

const TABLES_MAP = {
	'64': 't64',
	'32': 't32',
	'16': 't16',
	'quart': 't8',
	'demi': 't4',
	'bronze': 't2',
	'or': 't2'
};

const find_table = (tName) => {
	for(const [k, v] of Object.entries(TABLES_MAP)) {
		if(tName.match(k)) {
			return v;
		}
	}
};

module.exports = (nameFmt, defaultCountry) => 
	body => {
		const $ = htmlParser.load(body);
		const tables = {};

		$(".table-schedule tr").each((ir, tr) => {
			if(ir < 1) return;

			let first, second;

			const table = find_table($(tr).find(".flex-grow-1 a").first().html());

			if(!tables[table]) {
				tables[table] = [];
			}

			$(tr).find(".schedule-result .row").each((i, e) => {
				let name = $(e).find(".d-none.d-md-inline").first().html() || "";
				let country = $(e).find("abbr").first().html();
				let res = $(e).find(".resultContainer").first();
				let winner = res.hasClass("winner");
				let score = res.find(".result").first().html() || " ";

				// Fix a glitch
				if(country === "TBD") country = "";

				if(i === 0) first = [nameFmt(name, country), country, score, winner];
				else second = [nameFmt(name, country), country, score, winner];
			});

			tables[table].push([first, second]);
		});

		return tables;
	};