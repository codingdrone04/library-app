# Continuous Integration and Deployment

## Overview

This project implements a CI/CD pipeline using GitHub Actions to automate testing and deployment of the backend application.

## Pipeline workflow

```
Push to master → Run tests → Deploy to server
                    |
                    └─> If tests fail, deployment is blocked
```

## Technologies

- **GitHub Actions**: Pipeline orchestration
- **Jest**: Unit testing
- **Docker**: Containerization
- **SSH**: Secure deployment to remote server

## Configuration

The deployment is configured in `.github/workflows/deploy-backend.yml` with the following parameters:

- Server: `artemis.erwansinck.com:34343`
- User: `esinck`
- Deployment path: `~/UNCOVE/SAMOUEL/library-app`

## Setup instructions

See [.github/README.md](.github/README.md) for setup instructions.

## Deployment process

On each push to `master` that modifies `library-backend/`:

1. **Test phase**
   - Install dependencies
   - Run test suite (`npm test`)

2. **Deploy phase** (only if tests pass)
   - SSH to remote server
   - Pull latest changes from git
   - Rebuild Docker container
   - Restart services

## Monitoring

View deployment status and logs in the **Actions** tab on GitHub.
