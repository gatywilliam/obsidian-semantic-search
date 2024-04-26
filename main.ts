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

async function startVenv() {
	const activateScriptPath = path.join('.venv', 'Scripts', 'launch_venv.bat')
    spawn('cmd.exe', ['/C', "launch_venv.bat"])
}

async function runPythonBackend() {
	const scriptLoc = path.join(`${(this.app.vault.adapter as any).basePath}`, '.obsidian', 'plugins', 'semantic-search-plugin')
	const scriptPath = path.join(`${(this.app.vault.adapter as any).basePath}`, '.obsidian', 'plugins', 'semantic-search-plugin', 'launch.bat')
	// const server = spawn('cmd.exe', ['/C', wrapperScriptPath]);
	// const server = spawn('cmd.exe', ['/C', scriptPath, scriptLoc]);
	// const server = spawn('cmd.exe', ['/C', scriptPath]);
	spawn('cmd.exe', ['/C', 'echo off'])
	const server = spawn('cmd.exe', ['/C', 'python C:\\Users\\wgaty\\Documents\\School\\Spring 23-24\\NLP\\Final Submission\\semantic_search-final_product\\front_end\\Final Application\\.obsidian\\plugins\\semantic-search-plugin\\backend\\server.py'])
	server.stdout.on('data', (stdout) => {
		console.log(`BACKEND OUTPUT: ${stdout.toString()}`)
	})
	server.stderr.on('data', (stderr) => {
		console.log(`BACKEND ERROR: ${stderr.toString()}`)
	})
}

async function runBackend() {
	// const userDataPath = await this.app.getPath('userData')
	const activateScriptPath = path.join((this.app.vault.adapter as any).basePath, '.obsidian', 'plugins', 'semantic-search-plugin', 'launch.bat')
	// const activateScriptPath = path.join(`${(this.app.vault.adapter as any).basePath}`, '.obsidian', 'plugins', 'semantic-search-plugin', '.venv', '.Scripts', 'run_backend.bat')
	// console.log(`${(this.app.vault.adapter as any).basePath}`)
	const server = spawn('cmd.exe', ["/C", activateScriptPath]);
	// const server = spawn('bash', ["run_backend.bat"]);
	server.stdout.on('data', (stdout) => {
		console.log(`BACKEND OUTPUT: ${stdout.toString()}`)
	})
	server.stderr.on('data', (stderr) => {
		console.log(`BACKEND ERROR: ${stderr.toString()}`)
	})
}


export default class SemanticSearchPlugin extends Plugin {
	settings: MyPluginSettings;
	backendURL = "http://localhost:5000"
	warmedUp = false

	async onload() {
		await this.loadSettings();

		//wgaty
		// function runServer() {
		// 	// this.server = spawn('python', [this.backendPath])
		// 	console.log("Im here biatch")
		// 	const server = spawn('python3', ["/backend/integrated_server.py"])
		// 	console.log("Im there biatch")

		// 	server.stdout.on('data', (stdout: { toString: () => any; }) => {
		// 		console.log(`BACKEND OUTPUT: ${stdout.toString()}`)
		// 	})

		// 	server.stderr.on('data', (stderr: { toString: () => any; }) => {
		// 		console.log(`BACKEND ERROR: ${stderr.toString()}`)
		// 	})
		// }

		// runServer()

		// await runServer()
		// startVenv()
		// runPythonBackend()
		// runBackend()

		this.addRibbonIcon('dice', 'Run Search', () => {
			checkEmbeddings()
			if (this.warmedUp) {
			// if (true) {
				new UI_Modal(this.app, getUserInput).open()
			} else {
				new Notice('Warning: before running the search, please click \'Run Search Startup\'');
			}
		});

		const checkEmbeddings = () => {
			fetch(`${this.backendURL}/embeddings_status`, {
				method: 'GET',
				// mode: 'no-cors', //unsure if this is necessary for this use case
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


		this.addRibbonIcon('dice', 'Run Search Startup', () => {
			fetch(`${this.backendURL}/run_startup`, {
				method: 'POST',
				// mode: 'no-cors', //unsure if this is necessary for this use case
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					path: `${(this.app.vault.adapter as any).basePath}/Content`
				})
			}).then(() => {this.warmedUp = true}).catch(e => console.log(e))
		});

		const getUserInput = (result: string) => {
			fetch(`${this.backendURL}/get_query`, {
				method: 'POST',
				// mode: 'no-cors', //unsure if this is necessary for this use case
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					input: result
				})
			})
			getResults()
		}

		const getResults = () => {
			fetch(`${this.backendURL}/return_results`, {
				method: 'GET',
				// mode: 'no-cors', //unsure if this is necessary for this use case
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
				// mode: 'no-cors', //unsure if this is necessary for this use case
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
	//add a number of documents option
    onSubmit: (result: string) => void;

    constructor(app: App, onSubmit: (result: string) => void) {
        super(app);
        this.onSubmit = onSubmit;
    }

    onOpen() {
        let { contentEl } = this;
        contentEl.createEl("h1", { text: "Enter target term to search for:" });
        new Setting(contentEl)
            .setName("Term:")
            .addText((text) =>
                text.onChange((value) => {
                    this.result = value
                }));

        new Setting(contentEl)
            .addButton((btn) =>
                btn
                    .setButtonText("Submit")
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.onSubmit(this.result);
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
        contentEl.createEl("h1", { text: "Search Results" });
		console.log(typeof this.result)
		console.log(this.result)
		for (const c of this.result) {
			contentEl.createEl("p", {text: c.content})
		}
		// contentEl.createEl("p", {text: this.result})
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
