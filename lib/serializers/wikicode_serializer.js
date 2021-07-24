const countries = require("../../config/country_codes.json");

module.exports = function(matches, teams=false, cut=4) {
	const fmtMatches = [];

	// Create the line for each match
	for(const match of matches) {
		// TODO: make it modular (<small> shouldn't always be here, and ROC flag is meh)
		const hasCountries = [match[0][1] && (match[0][1] !== ""), match[1][1] && (match[1][1] !== "")]

		// Special case: SGP is old for SIN
		if(match[0][1] === "SGP") match[0][1] = "SIN";
		if(match[1][1] === "SGP") match[1][1] = "SIN";

		const fullCountries = [countries[match[0][1]], countries[match[1][1]]];
		const flags = [
			`{{${hasCountries[0] ? match[0][1] : "INC"}-d}}`,
			`{{${hasCountries[1] ? match[1][1] : "INC"}-d}}`
		];

		// Special case: Russia is under olympic flag
		if(match[0][1] === "ROC") flags[0] = "[[Fichier:Russian Olympic Committee flag.svg|20px|border]]";
		if(match[1][1] === "ROC") flags[1] = "[[Fichier:Russian Olympic Committee flag.svg|20px|border]]";

		let currentMatch = `||${flags[0]} `;
		if(match[0][3]) currentMatch += `'''`;
		if(match[0][0]) currentMatch += `[[${match[0][0]}]] `;
		if(hasCountries[0]) currentMatch += `<small>([[${fullCountries[0]} aux Jeux olympiques d'été de 2020|${match[0][1]}]])</small>`;
		if(match[0][3]) currentMatch += `'''`;
		currentMatch += `|`;
		if(match[0][3]) currentMatch += `'''`;
		currentMatch += `${match[0][2]}`;
		if(match[0][3]) currentMatch += `'''`;

		currentMatch += `||${flags[1]} `;
		if(match[1][3]) currentMatch += `'''`;
		if(match[1][0]) currentMatch += `[[${match[1][0]}]] `;
		if(hasCountries[1]) currentMatch += `<small>([[${fullCountries[1]} aux Jeux olympiques d'été de 2020|${match[1][1]}]])</small>`;
		if(match[1][3]) currentMatch += `'''`;
		currentMatch += `|`;
		if(match[1][3]) currentMatch += `'''`;
		currentMatch += `${match[1][2]}`;
		if(match[1][3]) currentMatch += `'''`;
		currentMatch += `|`;

		fmtMatches.push(currentMatch);
	}

	const totalMatches = fmtMatches.length;
	const cutEach = totalMatches / cut;

	// Handle cuts
	const finalMatches = [];

	for(let c = 0; c < cut; c++) {
		finalMatches.push([]);

		for(let r = 0; r < cutEach; r++) {
			finalMatches[c][r] = fmtMatches[c * cutEach + r];
		}
	}

	return finalMatches.map(a => a.join('\n'));
};
