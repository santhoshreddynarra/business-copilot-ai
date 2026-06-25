# Contributing to Business Copilot AI

Thank you for your interest in contributing! This document outlines everything you need to know to get started.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)

---

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to uphold these standards.

---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+
- Docker & Docker Compose
- Git

### Local Setup

1. **Fork** the repository on GitHub
2. **Clone** your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/business-copilot-ai.git
   cd business-copilot-ai
   ```
3. **Add upstream** remote:
   ```bash
   git remote add upstream https://github.com/santhoshreddynarra/business-copilot-ai.git
   ```
4. **Install dependencies**:
   ```bash
   # Backend
   cd packages/backend && npm install
   # Frontend
   cd packages/frontend && npm install
   # AI Service
   cd packages/ai-service && pip install -r requirements.txt
   ```
5. **Copy environment files**:
   ```bash
   cp .env.example .env
   ```
6. **Start the database and Qdrant**:
   ```bash
   docker-compose up -d postgres qdrant
   ```
7. **Run migrations and seed**:
   ```bash
   cd packages/backend
   npx prisma migrate dev
   npx ts-node src/scripts/seed.ts
   ```

---

## Development Workflow

1. **Sync with upstream** before starting work:
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

3. **Make your changes** and write/update tests.

4. **Run tests** to verify:
   ```bash
   cd packages/backend && npm test
   ```

5. **Commit** following our convention (see below).

6. **Push** and open a Pull Request.

---

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation changes only |
| `test` | Adding or updating tests |
| `refactor` | Code changes that neither fix bugs nor add features |
| `chore` | Build process, dependency updates, tooling |
| `perf` | Performance improvements |
| `ci` | CI/CD changes |

### Scopes

`auth`, `backend`, `frontend`, `ai-service`, `search`, `documents`, `validation`, `monitoring`, `infra`

### Examples

```
feat(auth): add OAuth2 Google provider
fix(search): handle empty query gracefully
docs: update README with Docker Compose instructions
test(auth): add integration tests for refresh token rotation
chore: upgrade Prisma to v6
```

---

## Pull Request Process

1. **Title**: Use the commit message format for the PR title.
2. **Description**: Fill out the PR template explaining:
   - What was changed and why
   - How to test it
   - Screenshots (if UI changes)
3. **Tests**: All PRs must include relevant tests. PRs without tests will not be merged.
4. **Review**: At least one approving review is required.
5. **CI**: All checks must pass.

### PR Checklist

- [ ] I have read the [CONTRIBUTING.md](CONTRIBUTING.md)
- [ ] My code follows the project's coding style
- [ ] I have added tests for my changes
- [ ] All existing tests pass
- [ ] I have updated documentation if needed
- [ ] My commits follow the conventional commit format

---

## Coding Standards

### TypeScript (Backend & Frontend)

- Use **TypeScript** strictly — no `any` types without justification
- Use `async/await` over raw Promises
- All public functions and classes must have **JSDoc/TSDoc comments**
- Use Zod for **all** input validation at the boundary layer
- Error handling must use the centralized `errorHandler` middleware

### Python (AI Service)

- Follow [PEP 8](https://peps.python.org/pep-0008/)
- Use type hints on all function signatures
- Use `async/await` for all FastAPI endpoint handlers

### General

- No dead code or commented-out blocks
- No hardcoded secrets or credentials — use environment variables
- Keep functions small and focused (single responsibility)

---

## Testing Requirements

- **Unit Tests**: Required for all services and utilities
- **Integration Tests**: Required for all API endpoints
- Minimum **80% coverage** on new code
- Run the full test suite before submitting:

```bash
cd packages/backend
npm test -- --coverage
```
