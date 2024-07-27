# Introduction
This is a project that a groupmate and I worked on for our Natural Language Processing (CSC4641) class during the spring semester of my senior year (2023/24). The published extension could not be finished within our timeframe, both due to technical difficulties with packaging a Python application and because publishing an extension requires approval from the Obdisian team, something which could take an undetermined amount of time. The portion of the project which I focused on was primarily the integration of the models into the Obsidian frontend, while my groupmate constructed the pipeline and models themselves.

## Instructions
1. Download Obsidian if you don't have it already, and create an empty vault. From there, it's suggested that you follow the steps at [this link](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin), up through step 3.
2. From there, copy the "backend" folder of our code into the main folder of the plugin (at /plugins/\<plugin name\>/). Additionally, copy all of the loose files in the repository into the main folder, and overwrite any files that already exist with the same names.
3. Next, since packaging and sharing Python code is painful, the .venv isn't included in this repo, but the requirements.txt file is. Please create the .venv and pip install the requirements document.
4. Please follow the instructions in launch.bat, which is the file that launches the Python backend whenever the Obsidian plugin is loaded. Alternatively, you can disable that in the code (in main.ts, remove "await runBackendCMD()" at around line 38) and run the .venv yourself, but it's more convenient to have it run itself. An example of the paths is provided in the launch_hardcoded.bat file.
5. The empty Obsidian vault will be empty (no, really), so feel free to copy the "Content" folder into vault. In the file structure used for building and demonstrating it, the folder should go on the same level as the .obsidian folder.

## Other Notes
- The originally-developed backend code was heavily modified in order to get it to play nice with the Obsidian frontend. It has been integrated together in server.py in the backend folder, but you can look in the "pre-integration-work/backend" folder to see what it looked like on its own.
- Feel free to contact us with questions about setup or use -- we know that this is a somewhat shoddy way of submitting everything, but it's the best plan B we could work with since actually publishing it wasn't feasible.
