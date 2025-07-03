#!/usr/bin/env node
import inquirer from "inquirer";
import { makeBranch } from "./commands/makeBranch.js";
import 'dotenv/config';
import { mergeWithMain } from "./commands/mergeWithMain.js";
import { exec } from 'child_process';
import util from 'util';
import { stashManager } from "./commands/stashManager.js";
const execAsync = util.promisify(exec);
async function mainMenu() {
    console.log('Welcome to GitBuddy!');
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'Make a branch',
                'Merge with main and commit your changes',
                'Stash Management (list/apply/drop/create)',
                'GitHub Account Options',
                'Exit'
            ],
        },
    ]);
    switch (action) {
        case 'Make a branch':
            await makeBranch();
            break;
        case 'Merge with main and commit your changes':
            await mergeWithMain();
            break;
        case 'Stash Management (list/apply/drop/create)':
            await stashManager();
            break;
        case 'GitHub Account Options':
            await githubAccountMenu();
            break;
        case 'Exit':
            console.log('Goodbye!');
            process.exit(0);
    }
}
async function githubAccountMenu() {
    const { ghAction } = await inquirer.prompt([
        {
            type: 'list',
            name: 'ghAction',
            message: 'GitHub Account Options:',
            choices: [
                'Switch account (interactive)',
                'Switch to a specific account',
                'Show authenticated accounts',
                'Back'
            ]
        }
    ]);
    switch (ghAction) {
        case 'Switch account (interactive)':
            await execAsync('gh auth switch');
            break;
        case 'Switch to a specific account':
            const { username } = await inquirer.prompt([
                { type: 'input', name: 'username', message: 'GitHub username:' }
            ]);
            await execAsync(`gh auth switch --user ${username}`);
            break;
        case 'Show authenticated accounts':
            const { stdout } = await execAsync('gh auth status');
            console.log(stdout);
            break;
        case 'Back':
            return;
    }
    // After action, show the menu again
    await githubAccountMenu();
}
mainMenu().catch((err) => {
    if ((err && err.name === "ExitPromptError") ||
        (err && typeof err.message === "string" && err.message.includes("SIGINT"))) {
        console.log("\nPrompt cancelled. Goodbye!");
        process.exit(0);
    }
    throw err;
});
