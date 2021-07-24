const defaultFmt = require("./default_name");

module.exports = (dictionnary, bot) =>
	(name, nation) => {
		name = defaultFmt(name, nation);

		// Initiate a request to the API
		if(!(name in dictionnary) && name.trim() != "" && bot) {
			bot.api.call({
				// We want to search something, without logging in
				"action": "opensearch",
				// What we're searching is the name given
				"search": name,
				// We only want one result
				"limit": 1,
				"namespace": 0,
				// Prevent CORS problems
				"origin": "*",
				"format": "json"
			}, (e, info, next, data) => {
				if(e) {
					console.error(e);
					return;
				}

				// If we get something, write it
				if(data[1].length >= 1) {
					dictionnary[name] = data[1][0];
				// If note, tell the program we already requested that name
				} else {
					dictionnary[name] = "NONE";
				}
			});
		}

		// Return the name anyway
		if(name in dictionnary && dictionnary[name] !== "NONE") {
			return dictionnary[name];
		} else {
			return name;
		}
	}
