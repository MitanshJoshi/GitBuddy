#!/usr/bin/env node
import inquirer from "inquirer";
import { makeBranch } from "./commands/makeBranch.js";
import 'dotenv/config';
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
                'Switch GitHub account',
                'Exit'
            ],
        },
    ]);
    switch (action) {
        case 'Make a branch':
            await makeBranch();
            break;
        case 'Merge with main and commit your changes':
            // Call merge/commit logic
            break;
        case 'Switch GitHub account':
            // Call account switch logic
            break;
        case 'Exit':
            console.log('Goodbye!');
            process.exit(0);
    }
}
mainMenu().catch((err) => {
    if ((err && err.name === "ExitPromptError") ||
        (err && typeof err.message === "string" && err.message.includes("SIGINT"))) {
        console.log("\nPrompt cancelled. Goodbye!");
        process.exit(0);
    }
    throw err;
});
