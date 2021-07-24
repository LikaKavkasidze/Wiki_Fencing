const htmlParser = require("cheerio");

const TABLES_MAP = {
	'64': 't64',
	'32': 't32',
	'16': 't16',
	'quart': 't8',
	'demi': 't4',
	'bronze': 't2',
	'or': 't2',
};

// Tables are given in the calling order, not in the table order
const ORDERING_MAPS = {
	't64': [0, 4, 8, 12, 16, 20, 24, 28, 3, 7, 11, 15, 19, 23, 27, 31, 1, 5, 9, 13, 17, 21, 25, 29, 2, 6, 10, 14, 18, 22, 26, 30],
	't32': [0, 4, 8, 12, 3, 7, 11, 15, 1, 5, 9, 13, 2, 6, 10, 14],
	't16': [0, 4, 3, 7, 1, 5, 2, 6],
	't8': [0, 3, 1, 2],
	't4': [0, 1],
	't2': [0],
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

		// Reorder the results
		for(const tableI in tables) {
			const originalTable = tables[tableI];
			const reorderedTable = new Array(originalTable.length);
			const orderingMap = ORDERING_MAPS[tableI];

			for(let i = 0; i < originalTable.length; i++) {
				reorderedTable[i] = originalTable[orderingMap[i]];
			}

			tables[tableI] = reorderedTable;
		}

		return tables;
	};