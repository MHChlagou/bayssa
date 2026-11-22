# Private GitHub testing: instructions

Prepared on 2026-11-22. I have not created a repository or pushed anything. Every command below is for you to run when you decide to.

## Read this first: GitHub Pages cannot be tested privately on a personal account

Two facts from GitHub's documentation decide what can be tested:

1. GitHub Pages works from a private repository only on a paid plan (Pro, Team or Enterprise).
2. A Pages site is public on the internet even when its repository is private. Only GitHub Enterprise Cloud can restrict who sees a site.

So deploying this app to Pages from a private repository would publish the dataset to anyone with the address. That contradicts "keep all existing content private". The instructions therefore test GitHub Actions privately, and test the deployable site on your own machine. A real Pages deployment waits for the public repository.

## What a private repository can prove

- The workflow installs, validates the content, lints, type-checks, and runs the unit and end-to-end tests on GitHub's Linux runners in three browser engines.
- The production build succeeds there.
- The exact site that would be deployed can be downloaded as an artifact and run locally.

It cannot prove the Pages deployment step, the live address, or link previews.

## Important: the repository you named is public

`github.com/MHChlagou/nafissa` exists, is public and is empty (checked on 2026-11-22). Do not push the current history to it: that would publish the dataset and the reports that quote it. Use a separate private repository for the steps below, and keep `MHChlagou/nafissa` for the clean-history public export.

## Step 1. The deployment gate (implemented)

The workflow is now `.github/workflows/ci.yml`. It verifies every push and pull request, and publishes nothing unless all three of these hold:

1. the repository variable `DEPLOY_PAGES` is set to the exact string `true`;
2. the repository is public;
3. the run is a push or a manual run on `main`, not a pull request.

The three conditions are combined into one value, `SHOULD_DEPLOY`, which gates the Pages configuration step, the Pages artifact upload and the whole `deploy` job. In a private repository condition 2 is false whatever the variable says, so a private repository cannot publish by mistake.

Every run also uploads the built site as an ordinary artifact named `site`, visible only to people with access to the repository.

The workflow has not run on GitHub yet, so the gate is untested there. On the first private run, check that the `deploy` job shows as skipped.

## Step 2. Create the private repository

On github.com: New repository, name `nafissa-private`, visibility Private, no README, no licence, no .gitignore.

Or with the GitHub CLI:

```
gh repo create nafissa-private --private --disable-wiki
```

Before pushing, check these settings:

- Settings, General: visibility shows Private.
- Settings, Pages: leave it untouched. Do not choose a source.
- Settings, Collaborators: nobody but you.
- Settings, Actions, General: allow actions, and set workflow permissions to read-only.

## Step 3. Push

```
cd /app/products/houda-douaa
git remote add private git@github.com:MHChlagou/nafissa-private.git
git push private main
```

Naming the remote `private` and not `origin` makes it harder to push this history to a public repository by habit later.

## Step 4. Watch the run

Actions tab, "Deploy to GitHub Pages" workflow. Expect roughly 8 to 12 minutes, most of it installing three browsers and running the end-to-end tests.

| If this fails | Likely cause |
|---|---|
| `npm ci` | Lock file out of step with `package.json` |
| `content:validate` | A dataset file missing from the commit |
| `playwright install --with-deps` | Runner image change. Re-run once before investigating |
| End-to-end tests | Download the `playwright-report` artifact. The Firefox offline test has failed intermittently before, and CI retries once |
| A step that mentions Pages runs, or the `deploy` job is not skipped | The gate is not working. Stop and report it |

Private repositories use your Actions minutes allowance. A run of this size is small against the free monthly allowance, but check Settings, Billing if you push often.

## Step 5. Test the deployable site locally

Download the `site` artifact from the run, unzip it, and serve it under the same path Pages would use:

```
mkdir -p /tmp/pages-test/nafissa
unzip site.zip -d /tmp/pages-test/nafissa
npx serve /tmp/pages-test -l 4000
```

Open `http://localhost:4000/nafissa/` and check: the home screen appears, a deep link such as `#/adhkar/morning` opens, the service worker installs, and the app reloads with the network off.

This proves the artifact is a working site under the `/nafissa/` path. It does not prove GitHub's own serving, HTTPS, or the live address.

## Step 6. What to leave for the public repository

- Turning on Pages and setting `DEPLOY_PAGES` to `true`.
- The first real deployment and everything in section 8 of the launch checklist.
- Installing from the live address on phones.

## If you do want a live Pages test before going public

The only way that keeps the content private is to deploy a build that does not contain it: the public-history export described in `public-clean-history-plan.md`, built with Quran-only content. That is a public site with nothing unresolved in it. It needs that export to exist first.

## Cleaning up

```
git remote remove private
```

Deleting the repository on GitHub removes the remote copy and its Actions artifacts. Artifacts also expire on their own.

Sources: [About GitHub Pages and plans](https://docs.github.com/en/get-started/learning-about-github/githubs-plans), [About privately published GitHub Pages sites](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/about-privately-published-github-pages-sites), [Creating a GitHub Pages site](https://docs.github.com/en/enterprise-cloud@latest/pages/getting-started-with-github-pages/creating-a-github-pages-site).
