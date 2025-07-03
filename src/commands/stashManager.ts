import { simpleGit } from 'simple-git';
import inquirer from 'inquirer';

const git = simpleGit();

export async function stashManager(): Promise<void> {
  while (true) {
    const stashList = await git.stashList();
    const stashChoices = stashList.all.map((stash, idx) => ({
      name: `${idx}: ${stash.message}`,
      value: idx
    }));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Stash Management:',
        choices: [
          ...(stashChoices.length > 0 ? [
            { name: 'Apply a stash', value: 'apply' },
            { name: 'Drop a stash', value: 'drop' },
            { name: 'Show stash list', value: 'list' }
          ] : []),
          { name: 'Create a new stash', value: 'create' },
          { name: 'Back', value: 'back' }
        ]
      }
    ]);

    if (action === 'back') break;

    if (action === 'list') {
      if (stashChoices.length === 0) {
        console.log('No stashes found.');
      } else {
        stashList.all.forEach((stash, idx) => {
          console.log(`${idx}: ${stash.message}`);
        });
      }
    }

    if (action === 'apply' && stashChoices.length > 0) {
      const { idx } = await inquirer.prompt([
        {
          type: 'list',
          name: 'idx',
          message: 'Select a stash to apply:',
          choices: stashChoices
        }
      ]);
      await git.stash(['apply', `stash@{${idx}}`]);
      console.log(`Applied stash ${idx}.`);
    }

    if (action === 'drop' && stashChoices.length > 0) {
      const { idx } = await inquirer.prompt([
        {
          type: 'list',
          name: 'idx',
          message: 'Select a stash to drop:',
          choices: stashChoices
        }
      ]);
      await git.stash(['drop', `stash@{${idx}}`]);
      console.log(`Dropped stash ${idx}.`);
    }

    if (action === 'create') {
        const { message } = await inquirer.prompt([
          {
            type: 'input',
            name: 'message',
            message: 'Enter a message for the new stash:'
          }
        ]);
        await git.stash(['push', '-m', message]);
        console.log('Created new stash.');
      }
  }
}