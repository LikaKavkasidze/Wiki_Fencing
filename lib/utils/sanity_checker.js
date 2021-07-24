const TABLE_ORDER = ["t64", "t32", "t16", "t8", "t4"];

module.exports = (tables, start="t64", rankings) => {
	// Check rankings to first table
	if(rankings) {
		const firstTable = tables[start];

		for(let m = 0; m < firstTable.length; m++) {
			const firstPlayer = firstTable[m][0][0];
			const secondPlayer = firstTable[m][1][0];

			if(firstPlayer && secondPlayer) {
				const firstRanking = rankings.indexOf(firstPlayer);
				const secondRanking = rankings.indexOf(secondPlayer);

				if(firstRanking !== -1 && secondRanking !== -1) {
					if(	(m % 2) && firstRanking < secondRanking ||
						!(m % 2) && firstRanking > secondRanking) {
							const tmp = firstTable[m][0];
							firstTable[m][0] = firstTable[m][1];
							firstTable[m][1] = tmp;
						}
				}
			}
		}
	}

	const firstTableId = TABLE_ORDER.indexOf(start);

	// Check coherence of results between tables
	for(let t = firstTableId + 1; t < TABLE_ORDER.length; t++) {
		const currentTable = tables[TABLE_ORDER[t]];
		const previousTable = tables[TABLE_ORDER[t - 1]];

		if(currentTable && previousTable) {
			for(let m = 0; m < currentTable.length; m++) {
				const firstPlayer = currentTable[m][0][0];
				const secondPlayer = currentTable[m][1][0];

				if(firstPlayer && secondPlayer) {
					const possibleFirst = [
						previousTable[2 * m][0][0],
						previousTable[2 * m][1][0],
					];

					const possibleSecond = [
						previousTable[2 * m + 1][0][0],
						previousTable[2 * m + 1][1][0],
					];

					if(	(!possibleFirst.includes(firstPlayer) && possibleSecond.includes(firstPlayer)) ||
						(!possibleSecond.includes(secondPlayer) && possibleFirst.includes(secondPlayer))) {
						const tmp = currentTable[m][0];
						currentTable[m][0] = currentTable[m][1];
						currentTable[m][1] = tmp;
					}
				}
			}
		}
	}
};