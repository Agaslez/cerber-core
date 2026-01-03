# Contributing to Guardian + Cerber

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what's best for the community
- Show empathy towards other community members

## How to Contribute

### Reporting Bugs

1. **Check existing issues** - Someone might have already reported it
2. **Create a new issue** with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS, etc.)
   - Code samples if applicable

### Suggesting Features

1. **Check existing feature requests**
2. **Open a new issue** with:
   - Clear use case
   - Why this feature is needed
   - Proposed implementation (optional)
   - Examples from other tools (if relevant)

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**:
   - Follow the coding style (see below)
   - Add tests for new features
   - Update documentation
   - Keep commits atomic and well-described

4. **Test your changes**:
   ```bash
   npm test
   npm run lint
   npm run build
   ```

5. **Commit with conventional commits**:
   ```bash
   git commit -m "feat: add new health check for Redis"
   git commit -m "fix: correct architect approval parsing"
   git commit -m "docs: update README with examples"
   ```

6. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **PR Description should include**:
   - What changes were made
   - Why these changes are needed
   - Related issue numbers
   - Screenshots (if UI changes)

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Agaslez/cerber-core.git
   cd cerber-core
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

4. **Build**:
   ```bash
   npm run build
   ```

5. **Test locally**:
   ```bash
   npm link
   cd /path/to/test/project
   npm link @your-org/guardian-cerber
   ```

## Coding Style

### TypeScript

- Use TypeScript for all new code
- Define explicit types (avoid `any`)
- Use interfaces for public APIs
- Document complex functions with JSDoc

### Naming Conventions

- **Files**: kebab-case (`health-checks.ts`)
- **Classes**: PascalCase (`Guardian`, `Cerber`)
- **Functions**: camelCase (`validateSchema`, `runChecks`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
- **Interfaces**: PascalCase with `I` prefix optional (`ValidationResult`)

### Code Organization

```
src/
├── guardian/
│   ├── index.ts         # Main Guardian class
│   └── validators.ts    # Validation logic
├── cerber/
│   ├── index.ts         # Main Cerber class
│   └── checks.ts        # Health check utilities
├── types.ts             # Shared types
└── index.ts             # Package entry point
```

### Testing

- Write tests for all new features
- Aim for >80% code coverage
- Use descriptive test names
- Mock external dependencies

Example test structure:
```typescript
describe('Guardian', () => {
  describe('validate', () => {
    it('should detect forbidden patterns', async () => {
      // Arrange
      const schema = { forbiddenPatterns: [...] };
      const guardian = new Guardian(schema);

      // Act
      const result = await guardian.validate();

      // Assert
      expect(result.errors).toContain(...);
    });
  });
});
```

## Adding New Features

### Adding a New Guardian Rule

1. Add pattern to schema interface (`src/types.ts`)
2. Implement validation logic in `src/guardian/validators.ts`
3. Add tests in `__tests__/guardian.test.ts`
4. Document in README and examples
5. Update CHANGELOG

### Adding a New Cerber Check

1. Define check function signature
2. Implement in `src/cerber/checks.ts` or separate file
3. Add example in `examples/health-checks.ts`
4. Write tests
5. Document in README

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Include examples for new features
- Update CHANGELOG.md

## Release Process

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create git tag:
   ```bash
   git tag v1.2.0
   git push origin v1.2.0
   ```
4. GitHub Actions will automatically publish to NPM

## Questions?

- Open a discussion in GitHub Discussions
- Join our community chat
- Email maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
