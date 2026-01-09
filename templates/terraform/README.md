# Terraform Template

This template provides a secure baseline for Terraform/IaC CI/CD workflows.

## Quick Start

```bash
npx cerber init --template terraform
```

## What's Included

- ✅ Secure permissions (read-only by default)
- ✅ Pinned actions (actions/checkout@v4, hashicorp/setup-terraform@v3)
- ✅ Required steps (terraform fmt, terraform validate)
- ✅ Terraform 1.0+ enforcement
- ✅ No state files in repository
- ✅ Plan on PR, manual apply workflow

## Example Workflow

See `example-workflow.yml` for a complete example.

## Rules

### Security (must-pass)
- No hardcoded secrets or credentials
- Actions pinned to versions
- Limited permissions (read-only)
- No Terraform state in repository
- No automatic apply (manual approval required)

### Terraform-Specific (must-pass)
- Format check required (`terraform fmt -check`)
- Validation required (`terraform validate`)
- Plan on pull requests
- Provider versions locked

### Best Practices (warnings)
- Use remote backend (S3, Terraform Cloud, etc.)
- Use workspaces for environments
- Cache Terraform plugins
- Use modules for reusability

## Workflow Stages

### 1. Format & Validate
```bash
terraform fmt -check
terraform init
terraform validate
```

### 2. Plan (on PR)
```bash
terraform plan -out=tfplan
```

### 3. Apply (manual, on main)
```bash
terraform apply tfplan
```

## State Management

**Important**: Never commit state files to your repository!

### Recommended Backends

#### AWS S3
```hcl
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}
```

#### Terraform Cloud
```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces {
      name = "my-workspace"
    }
  }
}
```

## Security Best Practices

1. **Use environment variables** for sensitive data:
   ```yaml
   env:
     AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
     AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
   ```

2. **Use OIDC** for cloud authentication (no static credentials)

3. **Review plans** before applying changes

4. **Use separate workspaces** for environments (dev, staging, prod)

## Customization

Edit `.cerber/contract.yml` to:
- Add/remove rules
- Change severity levels (error/warning/info)
- Add project-specific requirements
- Configure additional Terraform versions

## Common Use Cases

### Basic Infrastructure Validation
```yaml
- terraform init
- terraform fmt -check
- terraform validate
```

### Plan with Cost Estimation
```yaml
- terraform init
- terraform plan -out=tfplan
- infracost breakdown --path=tfplan
```

### Multi-Environment Deployment
```yaml
- terraform workspace select ${{ env.ENVIRONMENT }}
- terraform init
- terraform plan
```

## Learn More

- [Cerber Documentation](https://github.com/Agaslez/cerber-core)
- [Contract Schema](https://github.com/Agaslez/cerber-core/blob/main/src/contracts/contract.schema.json)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [HashiCorp Setup Terraform Action](https://github.com/hashicorp/setup-terraform)
