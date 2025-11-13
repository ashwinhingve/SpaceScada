# Contributing to WebSCADA

Thank you for your interest in contributing to WebSCADA! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Prerequisites**
   - Node.js >= 18.0.0
   - pnpm >= 8.0.0
   - Docker & Docker Compose (for local development)

2. **Initial Setup**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd webscada

   # Run the setup script
   ./scripts/dev-setup.sh

   # Or manually:
   pnpm install
   pnpm build
   ```

3. **Start Development**
   ```bash
   # Start all services with Docker Compose
   pnpm docker:up

   # Or start services individually
   pnpm --filter @webscada/backend dev
   pnpm --filter @webscada/frontend dev
   pnpm --filter @webscada/simulator dev
   ```

## Project Structure

```
webscada-system/
├── apps/           # Applications
│   ├── frontend/   # Next.js frontend
│   ├── backend/    # Fastify backend
│   └── simulator/  # Device simulator
├── packages/       # Shared packages
│   ├── shared-types/
│   ├── utils/
│   └── protocols/
└── infrastructure/ # Deployment configs
```

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear and structured commit history.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes

### Examples

```bash
feat(frontend): add real-time tag monitoring dashboard

Implement WebSocket connection for live tag updates
Add recharts for data visualization

Closes #123

fix(backend): resolve memory leak in protocol adapter

The Modbus adapter was not properly releasing connections
Added connection pooling and proper cleanup

perf(simulator): optimize data generation algorithm

Reduce CPU usage by 40% through caching

docs: update deployment instructions for Kubernetes
```

## Code Style

- We use ESLint and Prettier for code formatting
- Run `pnpm lint` to check for issues
- Run `pnpm format` to auto-format code
- Pre-commit hooks will automatically format staged files

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Add tests if applicable
   - Update documentation

3. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

4. **Push and create PR**
   ```bash
   git push origin feat/your-feature-name
   ```

5. **PR Requirements**
   - Clear description of changes
   - All tests passing
   - No linting errors
   - Updated documentation if needed

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @webscada/backend test
```

## Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @webscada/frontend build
```

## Deployment

### Docker Compose (Development)
```bash
docker-compose up
```

### Kubernetes (Production)
```bash
# Using kubectl
./scripts/k8s-deploy.sh

# Using Helm
helm install webscada ./infrastructure/helm/webscada

# Using Skaffold
skaffold dev
```

## Troubleshooting

### Port Conflicts
If you encounter port conflicts, update the ports in `.env.local` files:
- Frontend: 3000
- Backend: 3001
- Simulator: 5020

### Database Connection Issues
Ensure PostgreSQL and Redis are running:
```bash
docker-compose up postgres redis
```

### Build Errors
Clear build cache and reinstall:
```bash
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

## Getting Help

- Check existing issues on GitHub
- Review documentation
- Ask questions in discussions

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
