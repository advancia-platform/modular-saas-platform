# Contributing Guidelines 🤝

We welcome contributions! Here's how to get started and maintain high-quality
code standards.

## Workflow

1. **Fork & Clone**: Fork the repo and clone your fork locally
2. **Branch**: Create a feature branch from `main` using descriptive names
   (`feature/auth-system`, `fix/payment-bug`)
3. **Develop**: Follow our code standards, write tests, and ensure pre-commit
   hooks pass
4. **Submit**: Open a PR with clear description, link related issues, and
   request reviews

## Code Standards

- **Commit Messages**: Use [Conventional Commits](https://www.conventionalcommits.org/)
  format (`feat:`, `fix:`, `docs:`, etc.)
- **Pre-commit Hooks**: All commits must pass markdownlint, ESLint, Prettier,
  and security checks
- **Documentation**: Update relevant docs and include inline comments for
  complex logic
- **Testing**: Add unit/integration tests for new features and bug fixes

## Security & Compliance

- Never commit secrets, API keys, or sensitive data
- Follow secure coding practices outlined in `docs/SECURITY.md`
- All security-related changes require security team review

## Pull Request Checklist

- [ ] Pre-commit hooks pass locally
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] Security review completed (if applicable)
- [ ] Related issues linked and described

## Questions?

Check our [documentation](./docs/) or open an issue for clarification.
