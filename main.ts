import { App, Editor, MarkdownView, Vault, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { spawn } from 'child_process';
// import { runServer } from 'startBackend.js'
const path = require('path')

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

async function runBackendCMD() {
	// const activateScriptPath = path.join((this.app.vault.adapter as any).basePath, '.obsidian', 'plugins', 'semantic-search-plugin', 'launch.bat')
	const activateScriptPath = path.join((this.app.vault.adapter as any).basePath, '.obsidian', 'plugins', 'semantic-search-plugin', 'launch_hardcoded.bat')

	const server = spawn('cmd.exe', ["/C", activateScriptPath]);
	console.log((this.app.vault.adapter as any).basePath)

	server.stdout.on('data', (stdout) => {
		console.log(`BACKEND OUTPUT (cmd): ${stdout.toString()}`)
	})
	server.stderr.on('data', (stderr) => {
		console.log(`BACKEND ERROR (cmd): ${stderr.toString()}`)
	})
}


export default class SemanticSearchPlugin extends Plugin {
	settings: MyPluginSettings;
	backendURL = "http://localhost:5000"
	warmedUp = false

	async onload() {
		await this.loadSettings();

		await runBackendCMD()

		this.addRibbonIcon('dice', 'SemanticSearch: Run Search', () => {
			checkEmbeddings()
			if (this.warmedUp) {
				new UI_Modal(this.app, getUserInput).open()
			} else {
				// fetch(`${this.backendURL}/ping`, {
				// 	method: 'GET',
				// 	mode: 'no-cors', //unsure if this is necessary for this use case
				// 	headers: {
				// 		'Content-Type': 'application/json'
				// 	}
				// }).then(response => response.json()).then((data) => {
				// 	if(data.active == "true") {
				// 		new Notice('Warning: before running the search, please click \'Run Search Startup\'');
				// 	} else {
				// 		new Notice("Warning: something else is running at localhost:5000, SemanticSearch backend is not running at the correct location.")
				// 	}
				// 	new Notice('Warning: before running the search, please click \'Run Search Startup\'');
				// }).catch(e => console.log(e))
				new Notice('Warning: before running the search, please click \'Run Search Startup\'');
			}
		});

		const checkEmbeddings = () => {
			fetch(`${this.backendURL}/embeddings_status`, {
				method: 'GET',
				mode: 'no-cors', //unsure if this is necessary for this use case
				headers: {
					'Content-Type': 'application/json'
				}
			}).then(response => response.json())
			.then((data) => {
				if(data.embeddings_status == "true") {
					this.warmedUp = true
				} else {
					this.warmedUp = false
				}
			}).catch(e => console.log(e))
		}


		this.addRibbonIcon('dice', 'SemanticSearch: First time setup (PLEASE READ)', () => {
			new FirstTimeSetupModal(this.app).open()	
		});

		this.addRibbonIcon('dice', 'SemanticSearch: Run Search Startup (WARNING: WILL EAT UP CPU)', () => {
			fetch(`${this.backendURL}/run_startup`, {
				method: 'POST',
				mode: 'no-cors', //unsure if this is necessary for this use case
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					path: `${(this.app.vault.adapter as any).basePath}/Content`
				})
			}).then(() => {this.warmedUp = true})
			.then(() => {
				new Notice('Startup complete, ready to search!');
			})
			.catch(e => console.log(e))
		});

		const getUserInput = (result: string, num: string) => {
			fetch(`${this.backendURL}/get_query`, {
				method: 'POST',
				mode: 'no-cors', //unsure if this is necessary for this use case
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					input: result,
					num_results: num
				})
			})
			getResults()
		}

		const getResults = () => {
			fetch(`${this.backendURL}/return_results`, {
				method: 'GET',
				mode: 'no-cors', //unsure if this is necessary for this use case
				headers: {
					'Content-Type': 'application/json'
				}
			}).then(response => response.json())
			.then((data) => {
				new ResultModal(this.app, data.results).open()
			}).catch(e => console.log(e))
		}

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));

	}

	onunload() {
		//essentially just a shutdown signal
		const continueRunning = () => {
			fetch(`${this.backendURL}/continue_running`, {
				method: 'POST',
				mode: 'no-cors', //unsure if this is necessary for this use case
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					input: "false"
				})
			})
		}
		continueRunning()
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

export class UI_Modal extends Modal {
    result: string;
	num: string;
	//add a number of documents option
    onSubmit: (result: string, num: string) => void;

    constructor(app: App, onSubmit: (result: string, num: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        let { contentEl } = this;
        contentEl.createEl("h1", { text: "SemanticSearch: Enter target term to search for:" });
        new Setting(contentEl)
            .setName("Term:")
            .addText((text) =>
                text.onChange((value) => {
                    this.result = value
                }));

		new Setting(contentEl)
			.setName("Number of responses:")
			.addText((text) =>
				text.onChange((value) => {
					this.num = value
				}));

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Submit")
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onSubmit(this.result, this.num);
                    }));
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

export class ResultModal extends Modal {
    result: any;

    constructor(app: App, result: any) {
        super(app);
		this.result = result
    }

    onOpen() {
        let { contentEl } = this;
        contentEl.createEl("h1", { text: "SemanticSearch: Search Results" });
		console.log(typeof this.result)
		console.log(this.result)
		for (const c of this.result) {
			contentEl.createEl("h2", {text: `Doc title: ${c.document_name}`})
			contentEl.createEl("p", {text: c.content})
		}
		// contentEl.createEl("p", {text: this.result})
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

export class FirstTimeSetupModal extends Modal {

    constructor(app: App) {
        super(app);
    }

    onOpen() {
        let { contentEl } = this;
        contentEl.createEl("h1", { text: "SemanticSearch: First Time Setup" });
		contentEl.createEl("p", {text: "Welcome to the first time setup for SemanticSearch!"})
		contentEl.createEl("p", {text: "If you have not used this plugin before, please be sure to follow these instructions."})
		contentEl.createEl("p", {text: "If you do not have Python installed on your machine, please do so -- you can get it from the Microsoft Store, this application was built using Python 3.11."})
		contentEl.createEl("p", {text: "Once you have Python installed, if you do not have it added to your PATH, please do that now (use this if you need help: https://realpython.com/add-python-to-path/#how-to-add-python-to-path-on-windows)."})
		contentEl.createEl("p", {text: "Once you have that set up, as well as installing pip on your machine, please open a command prompt in the \'backend\' directory of this plugin, and run \'python pip install venv\' if you do not already have the venv library set up. If you do, you can skip straight to running the command \'python -m venv .venv'. Once it has been created, activate it by running \'.venv/Scripts/activate.bat\'. After activating it, please run \'pip install -r requirements.txt\'. The path to the requirements.txt file may need to be adjusted based on your environment."})
		contentEl.createEl("p", {text: "After all of that, please find the \'launch.bat\' file (it should be located in the main folder for this plugin), replace the text within the angled brackets (along with the brackets themselves) with the correct information."})
		contentEl.createEl("p", {text: "With all of that out of the way, you should be good to go!"})
    }

    onClose() {
        let { contentEl } = this;
        contentEl.empty();
    }
}

class SampleSettingTab extends PluginSettingTab {
	plugin: SemanticSearchPlugin;

	constructor(app: App, plugin: SemanticSearchPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
