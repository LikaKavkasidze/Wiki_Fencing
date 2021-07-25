#!/usr/bin/env node

const mw = require("nodemw");
const fs = require("fs");
const express = require("express");
const fetch = require("node-fetch");

const config = require("./config");

const nameFmt = require("./lib/formatters/wiki_name")(config.dictionnary);
const scraper = require("./lib/scrapers/olympics")(nameFmt, config.defaultCountry);
const wikiFmt = require("./lib/serializers/wikicode_serializer");
const pageEditorFactory = require("./lib/serializers/page_editor");
const sanityCheck = require("./lib/utils/sanity_checker");

const bot = new mw(config.bot);
const app = express();

const PageEditor = pageEditorFactory(bot);

// TODO: move this to a separate file
// Add array comparaison possibility
// see https://stackoverflow.com/questions/7837456/how-to-compare-arrays-in-javascript
Array.prototype.equals = function(array) {
	if(!Array.isArray(array)) { return false; }

	for(var i = 0; i < this.length; i++) {
		// Check if we have nested arrays
		if(this[i] instanceof Array && array[i] instanceof Array) {
			// Recurse into the nested arrays
			if(!this[i].equals(array[i]))
				return false;
		} else if(this[i] != array[i]) {
			// Warning - two different object instances will never be equal: {x:20} != {x:20}
			return false;
		}
	}

	return true;
};

// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", { enumerable: false });

// Log the bot in!
bot.logIn((e, data) => {
	if(e) {
		console.error(e);
		return;
	}

	console.log("Bot logged in!");
});

function updateEvent(event) {
	fetch(event.originPage)
		.then(res => res.text())
		.then(res => {
			// Prevent update too often
			const timestamp = Date.now();

			if(event.lastUpdate && event.lastUpdate + 5 * 60000 > timestamp) return;

			event.lastUpdate = timestamp;

			const scraped = scraper(res);
			const editor = new PageEditor(event.wikiPage);

			sanityCheck(scraped, "t32", event.parsedRankings);

			// No support for partial T64 by now
			// No support for T4 & T2 either
			delete scraped["t64"];
			delete scraped["t4"];
			delete scraped["t2"];

			let changed = false;

			for(const table in scraped) {
				if(event.previousTables && scraped[table].equals(event.previousTables[table])) continue;

				const fmt = wikiFmt(scraped[table]);
				
				for(const [part, currentTable] of Object.entries(fmt)) {
					editor.addModificator([
						`===${config.matchings.words.findDetails}===`,
						`====${config.matchings.words.findParts[part]}====`,
						config.matchings.tables[table]
					], currentTable);
				}

				editor.addCommitMessage(table + ", ");
				changed = true;
			}

			if(changed) {
				editor.commit = editor.commit.slice(0, -2);
				editor.addCommitMessage(".");
				editor.submitPage();

				event.previousTables = scraped;
			}
		})
}

const requestHandler = scheduledEvent =>
	(req, res) => {
		const timestamp = Date.now();

		if(timestamp > scheduledEvent.startTime && timestamp < scheduledEvent.endTime) {
			updateEvent(scheduledEvent);
			res.send("Update done.");
		} else {
			res.status(403).send();
		}
	};

for(const scheduledEvent of config.schedule) {
	const scheduledName = scheduledEvent.shortName;

	// Cache ranking names
	scheduledEvent.parsedRankings = scheduledEvent.initialRankings.map(([name, nation]) => nameFmt(name, nation));

	app.get(`/${scheduledName}`, requestHandler(scheduledEvent));
}

function updateAll() {
	for(const scheduledEvent of config.schedule) {
		updateEvent(scheduledEvent);
	}
}

// Auto-pooling every minute
let updateIntervalId = setInterval(updateAll, 60000);
let running = true;

app.get("/stop", (req, res) => {
	if(running) {
		console.log("Pooling was stopped");
		clearInterval(updateIntervalId);
		running = false;

		res.send("Bot stopped.");
	} else {
		res.status(405).send("Already stopped.");
	}
});

app.get("/start", (req, res) => {
	if(!running) {
		console.log("Pooling was started");
		updateIntervalId = setInterval(updateAll, 60000);
		running = true;

		res.send("Bot started.");
	} else {
		res.status(405).send("Already running.");
	}
});

app.listen(3141);
