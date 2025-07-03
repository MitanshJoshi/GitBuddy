import { simpleGit } from 'simple-git';
import inquirer from 'inquirer';
import { getCommitMessageFromAI } from '../utils/commitMessageAI.js'; // You need to implement this
import { exec } from 'child_process';
import util from 'util';
const execAsync = util.promisify(exec);

const git = simpleGit();

async function getSuggestedCommitMessage(): Promise<{ message: string; description: string }> {
    // Get the full diff or summary
    const diff = await git.diff(['main']);
    // Call your AI helper with the diff
    const aiResult = await getCommitMessageFromAI(diff);
  
    // Fallback if AI fails
    if (!aiResult || !aiResult.message) {
      const diffSummary = await git.diffSummary(['main']);
      const filesChanged = diffSummary.files.map(f => f.file).join(', ');
      return {
        message: filesChanged
          ? `Merge main into feature branch, update: ${filesChanged}`
          : 'Merge main into feature branch',
        description: `This commit merges the latest changes from main into the current feature branch and updates the following files: ${filesChanged}`,
      };
    }
  
    return {
      message: aiResult.message,
      description: aiResult.description || '',
    };
  }

export async function mergeWithMain(): Promise<void> {
  // Get the current branch name
  const status = await git.status();
  const currentBranch = status.current;
  let finalMessage = '';
  let finalDescription = '';

  // Confirm the feature branch (optional, for safety)
  if (currentBranch === 'main') {
    console.log("You're already on main. Please switch to your feature branch first.");
    return;
  }

  // Stash uncommitted changes, if any
  if (status.files.length > 0) {
    console.log('Stashing your uncommitted changes...');
    await git.stash();
  }

  // Checkout main and pull latest
  console.log('Switching to main and pulling latest changes...');
  await git.checkout('main');
  await git.pull('origin', 'main');

  // Switch back to feature branch
  console.log(`Switching back to ${currentBranch}...`);
  if (currentBranch) {
    await git.checkout(currentBranch);
  } else {
    console.error('Current branch is null. Unable to switch back.');
    return;
  }

  // Merge main into feature branch
  console.log('Merging main into your feature branch...');
  try {
    await git.merge(['main']);
    console.log('Merge completed successfully.');
  } catch (error) {
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
  } else {
    console.log('No changes to commit after merge.');
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
    try {
      const cmd = `gh pr create --base main --head ${currentBranch}`;
      await execAsync(cmd);
      console.log('Pull request created!');
    } catch (err: any) {
      if (err.stderr && err.stderr.includes('already exists')) {
        // Extract the PR URL from the error message if present
        const match = err.stderr.match(/https:\/\/github\.com\/[^\s]+/);
        if (match) {
          console.log(`A pull request for this branch already exists: ${match[0]}`);
        } else {
          console.log('A pull request for this branch already exists.');
        }
      } else {
        console.error('Failed to create pull request:', err);
      }
    }
  }
}
