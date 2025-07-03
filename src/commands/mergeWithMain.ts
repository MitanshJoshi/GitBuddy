import inquirer from 'inquirer';
import { simpleGit } from 'simple-git';

const git = simpleGit();

export async function mergeWithMain(): Promise<void> {
  // Get the current branch name
  const status = await git.status();
  const currentBranch = status.current;

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
    const { shouldCommit } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldCommit',
        message: 'There are changes to commit after merge. Commit now?',
        default: true,
      },
    ]);
    if (shouldCommit) {
      await git.add('.');
      await git.commit(`Merge main into ${currentBranch}`);
      console.log('Changes committed.');
    }
  } else {
    console.log('No changes to commit after merge.');
  }

  // Push updated feature branch
  await git.push('origin', currentBranch);
  console.log('Feature branch pushed to remote.');
}
