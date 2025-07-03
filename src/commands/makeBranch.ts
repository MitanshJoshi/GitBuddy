import inquirer from 'inquirer';
import { simpleGit } from 'simple-git';
import { getBranchNameFromGemini } from '../utils/branchNameSuggestion.js';
// import { getBranchNameFromAI } from '../utils/ai.js'; // Example AI helper

const git = simpleGit();

export async function makeBranch(): Promise<void> {
  console.log("makeBranch called");
  const { mode }: { mode: string } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: 'How would you like to name your branch?',
      choices: [
        'Input branch name myself',
        'Describe intention and get a suggestion'
      ]
    }
  ]);

  let branchName: string;

  if (mode === 'Input branch name myself') {
    const { name }: { name: string } = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Branch name:' }
    ]);
    branchName = name;
  } else {
    const { intention }: { intention: string } = await inquirer.prompt([
      { type: 'input', name: 'intention', message: 'Describe the feature/fix:' }
    ]);
    // Call your AI function here (replace with your actual implementation)
    // const aiSuggestion = await getBranchNameFromAI(intention);
    // For now, fallback to slugify:
    const aiSuggestion = `feat/${intention.trim().toLowerCase().replace(/\s+/g, '-')}`;
    const geminiSuggestion = await getBranchNameFromGemini(intention);
    console.log("Gemini suggestion:", geminiSuggestion);
    const finalName = geminiSuggestion;
      
    branchName = finalName;
  }

  try {
    await git.checkoutLocalBranch(branchName);
    console.log(`Switched to new branch: ${branchName}`);
  } catch (error) {
    console.error('Failed to create branch:', error);
  }
}
