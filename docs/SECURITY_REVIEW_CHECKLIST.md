# Security Review Checklist ✅

All changes that impact security must follow this checklist before merging:

- [ ] **Required Reviewers**  
  - Changes to `docs/SECURITY.md` → must be reviewed by **@security-team**  
  - Changes to `docs/GOVERNANCE_OVERVIEW.md` → must be reviewed by
    **@compliance-team**  
  - Backend authentication/authorization code → must be reviewed by
    **@backend-team**  

- [ ] **Linting & Formatting**  
  - Run `pre-commit run --all-files`  
  - Ensure `markdownlint` passes with no violations  

- [ ] **Secrets Management**  
  - No hard‑coded credentials or API keys  
  - Use environment variables or secret managers (Vault, AWS Secrets Manager,
    Azure Key Vault)  

- [ ] **Testing & Validation**  
  - Unit tests updated for new security logic  
  - Integration tests pass locally and in CI/CD  

- [ ] **Documentation**  
  - Update `SECURITY.md` with any new controls or policies  
  - Add notes in `CHANGELOG.md` for visibility  

---

By following this checklist, contributors ensure that all security‑related
changes are properly reviewed, compliant, and auditable.
