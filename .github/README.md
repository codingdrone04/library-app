# CI/CD Pipeline

This project uses GitHub Actions to automate testing and deployment of the backend to a remote server.

## How it works

When you push to `master` branch with changes to `library-backend/`:
1. GitHub Actions runs the test suite
2. If tests pass, the workflow connects to the server via SSH
3. Pulls latest changes and rebuilds the Docker container

## Setup

### Required secret

Add the following secret to your GitHub repository:

**Settings** > **Secrets and variables** > **Actions** > **New repository secret**

- Name: `SSH_PRIVATE_KEY`
- Value: Content of `~/.ssh/id_ed25519`

```bash
cat ~/.ssh/id_ed25519 | pbcopy
```

### Server configuration

The workflow is configured for:
- Host: `artemis.erwansinck.com`
- User: `esinck`
- Port: `34343`
- Project path: `~/UNCOVE/SAMOUEL/library-app`

## Testing the setup

```bash
# Test SSH connection
.github/test-connection.sh

# Make a change and deploy
git add .
git commit -m "test: CI/CD deployment"
git push origin master
```

Check the workflow status in **Actions** tab on GitHub.

## Workflow file

The pipeline is defined in [workflows/deploy-backend.yml](workflows/deploy-backend.yml).
