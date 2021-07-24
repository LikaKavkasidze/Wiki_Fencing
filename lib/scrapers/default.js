const ft = require("./fencing_time");
const eg = require("./engarde_escrime");
const olympics = require("./olympics");

// A function somewhat safer than eval(parser + '(' + body + ')')...
module.exports = function(parser) {
	switch(parser.trim()) {
		case "ft":
			return ft;
		break;

		case "eg":
			return eg;
		break;

		case "ol":
			return olympics;
		break;

		default:
			return { };
	}
};
