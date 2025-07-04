# GitBuddy CLI

**GitBuddy CLI** is your AI-powered, interactive assistant for Git and GitHub workflows. It streamlines branch management, merging, stashing, and changelog generation.

---

## ✨ Features

- **Branch Management**
  - Create new branches with smart, AI-suggested names or custom names.
  - Switch to new branches instantly.

git - **Merge with default branch & Commit**
  - Merge the latest changes from `default branch` into your feature branch.
  - AI-assisted commit message suggestions.
  - Prompts to push changes and create pull requests with customizable titles and bodies.

- **Stash Management**
  - Interactive stash menu: list, create, apply, and drop stashes.
  - Add messages to stashes for better organization.
  - Prevents applying stashes if you have uncommitted changes.

- **Changelog & Release Summaries**
  - Summarize changes since the last release/tag using AI.
  - Generate and optionally save changelogs to `CHANGELOG.md`.

- **GitHub Account Management**
  - Switch between authenticated GitHub accounts (interactive or by username).
  - View all authenticated accounts.

- **AI Integration**
  - Uses Google Gemini for branch names, commit messages, and changelog summaries.

---

## 🚀 Installation

```sh
npm install -g gitbuddy-cli
```

---

## 🛠️ Usage

Run from any git repository:

```sh
gitbuddy
```

You'll see an interactive menu with options like:

- Make a branch
- Merge with default branch and commit your changes
- Stash Management (list/apply/drop/create)
- GitHub Account Options
- Show changelog since last release
- Exit

---

## 🧠 AI-Powered Workflows

- **AI Commit Messages:**  
  Get smart, context-aware commit message suggestions when merging.

- **AI Changelog Summaries:**  
  Summarize all changes since the last release/tag in natural language.

---

## 📝 Example Workflows

### Create a Branch

- Choose "Make a branch"
- Describe your intention or enter a name
- GitBuddy suggests a branch name or uses your input

### Merge with default github branch

- Choose "Merge with default branch and commit your changes"
- GitBuddy pulls the latest `default branch`, merges, and suggests a commit message
- Handles stashing and unstashing automatically

### Stash Management

- Choose "Stash Management"
- List, create (with message), apply, or drop stashes interactively

### Changelog Generation

- Choose "Show changelog since last release"
- GitBuddy summarizes all commits since the last tag using AI
- Optionally saves the changelog to `CHANGELOG.md`

---

## ⚙️ Configuration

- Requires a `.env` file with your Gemini API key:
  ```
  GEMINI_API_KEY=your-key-here
  ```
- Make sure you have [GitHub CLI](https://cli.github.com/) (`gh`) installed and authenticated for PR features.

---

## 🧩 Extending

- Add your own commands or AI integrations by editing the `src/commands` and `src/utils` folders.

---

## 🛡️ License

ISC

---

## 🙋‍♂️ Author

[Mitansh Joshi](https://github.com/MitanshJoshi)

---

## 💡 Contributing

Pull requests and suggestions are welcome!
