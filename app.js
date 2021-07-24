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

const bot = new mw(config.bot);
const app = express();

const PageEditor = pageEditorFactory(bot);

/*const ordering = [
	0, 4, 8, 12, 3, 7, 11, 15, 1, 5, 9, 13, 2, 6, 10, 14
]*/

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
			const scraped = scraper(res);
			const editor = new PageEditor(event.wikiPage);

			// No support for partial T64 by now
			// No support for T4 & T2 either
			delete scraped["t64"];
			delete scraped["t4"];
			delete scraped["t2"];

			for(const table in scraped) {
				const fmt = wikiFmt(scraped[table]);
				
				for(const [part, currentTable] of Object.entries(fmt)) {
					editor.addModificator([
						`===${config.matchings.words.findDetails}===`,
						`====${config.matchings.words.findParts[part]}====`,
						config.matchings.tables[table]
					], currentTable);
				}

				editor.addCommitMessage(table + ", ");
			}

			editor.commit = editor.commit.slice(0, -2);
			editor.addCommitMessage(".");
			editor.submitPage();
		})
}

const requestHandler = scheduledEvent =>
	(req, res) => {
		const timestamp = Date.now();

		if(timestamp > scheduledEvent.startTime && timestamp < scheduledEvent.endTime) {
			updateEvent(scheduledEvent);
			res.status(204).send();
		} else {
			res.status(403).send();
		}
	};

for(const scheduledEvent of config.schedule) {
	const scheduledName = scheduledEvent.shortName;

	app.get(`/${scheduledName}`, requestHandler(scheduledEvent));
}

app.listen(3000);
