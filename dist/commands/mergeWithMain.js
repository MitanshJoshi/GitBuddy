import { simpleGit } from 'simple-git';
import inquirer from 'inquirer';
import { getCommitMessageFromAI } from '../utils/commitMessageAI.js'; // You need to implement this
const git = simpleGit();
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export async function getDefaultBranch() {
    try {
        // Try reading from git remote show origin
        const { stdout } = await execAsync('git remote show origin');
        const match = stdout.match(/HEAD branch: (.+)/);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    catch (err) {
        console.warn('⚠️ Failed to detect default branch from git remote show origin.');
    }
    // Fallback: Look for common default branches
    const remoteBranches = await git.branch(['-r']);
    const candidates = ['main', 'master', 'develop', 'trunk'];
    const found = candidates.find(branch => remoteBranches.all.includes(`origin/${branch}`));
    if (found)
        return found;
    // No luck
    return null;
}
async function getSuggestedCommitMessage() {
    const defaultBranch = await getDefaultBranch();
    if (!defaultBranch) {
        console.error('❌ Could not determine default branch. Aborting.');
        return {
            message: 'default branch does not exists',
            description: 'Set a default branch to continue',
        };
    }
    // Get the full diff or summary
    const diff = await git.diff([defaultBranch]);
    // Call your AI helper with the diff
    const aiResult = await getCommitMessageFromAI(diff);
    // Fallback if AI fails
    if (!aiResult || !aiResult.message) {
        const diffSummary = await git.diffSummary([defaultBranch]);
        const filesChanged = diffSummary.files.map(f => f.file).join(', ');
        return {
            message: filesChanged
                ? `Merge ${defaultBranch} into feature branch, update: ${filesChanged}`
                : `Merge ${defaultBranch} into feature branch`,
            description: `This commit merges the latest changes from ${defaultBranch}
       into the current feature branch and updates the following files: ${filesChanged}`,
        };
    }
    return {
        message: aiResult.message,
        description: aiResult.description || '',
    };
}
export async function mergeWithMain() {
    // Get the current branch name
    const status = await git.status();
    const currentBranch = status.current;
    const defaultBranch = await getDefaultBranch();
    let finalMessage = '';
    let finalDescription = '';
    // Confirm the feature branch (optional, for safety)
    if (currentBranch === defaultBranch) {
        console.log(`You're already on ${defaultBranch}. Please switch to your feature branch first.`);
        return;
    }
    // Stash uncommitted changes, if any
    if (status.files.length > 0) {
        console.log('Stashing your uncommitted changes...');
        await git.stash();
    }
    console.log(`Switching to ${defaultBranch} and pulling latest changes...`);
    if (!defaultBranch) {
        console.error('Default branch is undefined. Unable to switch.');
        return;
    }
    await git.checkout(defaultBranch);
    await git.pull('origin', defaultBranch);
    // Switch back to feature branch
    console.log(`Switching back to ${currentBranch}...`);
    if (currentBranch) {
        await git.checkout(currentBranch);
    }
    else {
        console.error('Current branch is null. Unable to switch back.');
        return;
    }
    // Merge main into feature branch
    console.log('Merging default branch into your feature branch...');
    try {
        await git.merge([defaultBranch]);
        console.log('Merge completed successfully.');
    }
    catch (error) {
        console.error('Merge conflicts detected. Please resolve them manually.');
        return;
    }
    // Pop stashed changes, if any
    const stashList = await git.stashList();
    if (stashList.total > 0) {
        console.log('Applying your stashed changes...');
        await git.stash(['pop']);
    }
    // Show status and prompt for commit if needed
    const postMergeStatus = await git.status();
    if (postMergeStatus.files.length > 0) {
        // 1. Generate suggestion
        const { message, description } = await getSuggestedCommitMessage();
        // 2. Prompt user to accept or edit
        const { useSuggested } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'useSuggested',
                message: `Suggested commit message:\n"${message}"\n\nDescription:\n"${description}"\n\nUse this?`,
                default: true,
            },
        ]);
        finalMessage = message;
        finalDescription = description;
        if (!useSuggested) {
            // 3. Prompt for custom input, with suggestion as default
            const custom = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'customMessage',
                    message: 'Enter commit message:',
                    default: message,
                },
                {
                    type: 'input',
                    name: 'customDescription',
                    message: 'Enter commit description (optional):',
                    default: description,
                },
            ]);
            finalMessage = custom.customMessage;
            finalDescription = custom.customDescription;
        }
        await git.add('.');
        await git.commit(`${finalMessage}\n\n${finalDescription}`);
        console.log('Changes committed.');
    }
    else {
        console.log('No changes to commit after merge.');
        finalMessage = `Merge ${defaultBranch} into feature branch`;
        finalDescription = `This commit merges the latest changes from ${defaultBranch} into the current feature branch.`;
    }
    // Push updated feature branch
    await git.push('origin', currentBranch);
    console.log('Feature branch pushed to remote.');
    const { shouldPR } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'shouldPR',
            message: 'Do you want to create a pull request for this branch?',
            default: true,
        }
    ]);
    if (shouldPR) {
        // Create PR using GitHub CLI
        const { exec } = await import('child_process');
        const util = await import('util');
        const execAsync = util.promisify(exec);
        try {
            const cmd = `gh pr create --title "${finalMessage}"${finalDescription ? ` --body "${finalDescription}"` : ''} --base ${defaultBranch} --head ${currentBranch}`;
            await execAsync(cmd);
            console.log('Pull request created!');
        }
        catch (err) {
            console.error('Failed to create pull request:', err);
        }
    }
}
