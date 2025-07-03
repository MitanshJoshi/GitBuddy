import { simpleGit } from 'simple-git';
import inquirer from 'inquirer';
import { getSummaryFromAI } from '../utils/aiSummary.js'; 
import { printChangelog } from '../utils/printChangelog.js';

const git = simpleGit();

export async function summarizeSinceLastRelease() {
  // Get the last tag (release)
  const tags = await git.tags();
  const lastTag = tags.latest;

  let log;
  if (lastTag) {
    log = await git.log({ from: lastTag, to: 'HEAD' });
  } else {
    log = await git.log();
  }

  const commitMessages = log.all.map(c => `- ${c.message}`).join('\n');
  const prompt = `
Summarize the following git commit messages since the last release.
Classify them as features, bugfixes, or breaking changes. Give a short summary and a changelog.

Commits:
${commitMessages}
`;

  const summary = await getSummaryFromAI(prompt);
  printChangelog(summary);

  // Optionally, ask if user wants to save the changelog
  const { wantSave } = await inquirer.prompt([
    { type: 'confirm', name: 'wantSave', message: 'Save changelog to CHANGELOG.md?', default: false }
  ]);
  if (wantSave) {
    const fs = await import('fs');
    fs.appendFileSync('CHANGELOG.md', `\n## Changes since ${lastTag || 'start'}\n${summary}\n`);
    console.log('Changelog appended to CHANGELOG.md');
  }
}