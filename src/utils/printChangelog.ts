import chalk from 'chalk';

export function printChangelog(summary: string) {
  // Replace markdown bold with terminal bold
  let output = summary
    .replace(/\*\*(.*?)\*\*/g, (_, text) => chalk.bold(text))
    .replace(/^\* /gm, chalk.green('• ')); // List bullets

  // Optionally, style headings
  output = output.replace(/^## (.*)$/gm, (_, text) => chalk.blue.bold(`\n${text}\n`));

  console.log(output);
}