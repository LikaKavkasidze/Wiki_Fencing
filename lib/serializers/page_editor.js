// Centralization of page modification because Wikipedia can't stand more than
// two updates in a row.
module.exports = bot => {
	class PageEditor {
		constructor(name) {
			this.name = name;
			this.modificators = [];
			this.commit = "[BOT] ";
		}

		addModificator(parts, content) {
			this.modificators.push({ parts: parts, content: content.split('\n') });
		}

		addCommitMessage(message) {
			this.commit += message;
		}

		submitPage() {
			// First, get the article and save it's data
			bot.getArticle(this.name, (e, data) => {
				if(e) {
					console.error(e);
					return;
				}

				let pageContent = data;

				const lines = pageContent.split('\n');

				// Apply each modificator
				for(let m = 0; m < this.modificators.length; m++) {
					let i = 0;
					// Search for keywords, in order
					for(let p = 0; p < this.modificators[m].parts.length; p++) {
						while(lines[i].trim() != this.modificators[m].parts[p].trim() && i < lines.length - 1) {
							i++;
						}
					}

					// End of the file, we did not found anything...
					// Go to the next modificator
					if(i >= lines.length - 1) {
						console.error("Searched terms were not found.");
						continue;
					}

					// Apply each modificator
					for(let l = 0; l < this.modificators[m].content.length; l++) {
						if(this.modificators[m].content[l].trim() != "") {
							lines[++i] = this.modificators[m].content[l];
						}
					}
				}

				// Then, after the keyword, *replace* the next lines with what we provided
				pageContent = lines.join('\n');

				// Edit the wiki, with a little message
				bot.edit(this.name, pageContent, this.commit, true, (e, data) => {
					if(e) console.log(e);
					else console.log("ok", data);
				});
			});
		}

		discardAll() {
			this.modificators = [];
			this.commit = "[BOT] ";
		}
	}

	return PageEditor;
};
