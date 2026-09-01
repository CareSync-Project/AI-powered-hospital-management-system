# Git Workflow

## Branches

- `main` contains reviewed, stable releases. Direct feature development should not occur here.
- `develop` contains reviewed integration work for the next release.
- `feature/*` branches contain one bounded module or change and branch from `develop`.

Planned branch names include `feature/backend`, `feature/database`, `feature/authentication`, `feature/hospital-management`, `feature/appointments`, `feature/patient-pwa`, `feature/vitals-triage`, and `feature/ai-symptom-assessment`.

## Standard flow

1. Update local `develop` from the remote.
2. Create a narrowly scoped branch: `git checkout -b feature/<name> develop`.
3. Commit small, reviewable changes using descriptive messages.
4. Push the feature branch and open a pull request into `develop`.
5. Run build, lint, tests, schema validation, and security checks appropriate to the change.
6. Merge only after review and passing checks; delete the merged feature branch.
7. When a phase/release is stable, open a pull request from `develop` into `main` and tag the reviewed release.

## Commit guidance

Use messages such as `feat: add hospital validation`, `fix: protect appointment ownership`, `docs: update phase 2 schema`, and `chore: establish full-stack project foundation`. Do not commit generated builds, dependencies, `.env` files, database passwords, JWT secrets, private credentials, or production keys.

## Initial repository setup

Run from the project root after reviewing Phase 1 files:

```bash
git init
git add .
git commit -m "chore: establish full-stack project foundation"
git branch -M main
git checkout -b develop
```

Create the GitHub repository named `ai-powered-hospital-management-system`, then replace `<YOUR_GITHUB_REPOSITORY_URL>` below with the URL GitHub gives you:

```bash
git remote add origin <YOUR_GITHUB_REPOSITORY_URL>
git push -u origin main
git push -u origin develop
```

Before the first push, run `git status` and a secret scan, and verify that only example environment files are staged.
