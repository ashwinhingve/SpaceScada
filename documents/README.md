# WebSCADA Documentation

Welcome to the WebSCADA system documentation. This directory contains all technical documentation, guides, and references for the WebSCADA industrial IoT platform.

## Documentation Structure

### Architecture
Detailed system architecture, design decisions, and component specifications.

- **[overview.md](./architecture/overview.md)** - System architecture overview and design principles
- **[components.md](./architecture/components.md)** - Detailed component architecture and interactions
- **[data-flow.md](./architecture/data-flow.md)** - Data flow diagrams and real-time processing
- **[infra.md](./architecture/infra.md)** - Infrastructure architecture and deployment topology
- **[frontend-arch.md](./architecture/frontend-arch.md)** - Frontend architecture and design patterns
- **[gis-module.md](./architecture/gis-module.md)** - GIS module architecture and integration

### Developer Guides
Essential guides for developers working on the WebSCADA platform.

- **[setup-local.md](./developer-guides/setup-local.md)** - Local development environment setup
- **[coding-standards.md](./developer-guides/coding-standards.md)** - Code style, conventions, and best practices
- **[contrib-guide.md](./developer-guides/contrib-guide.md)** - Contribution guidelines and workflow
- **[testing-and-ci.md](./developer-guides/testing-and-ci.md)** - Testing strategies and CI/CD pipelines
- **[database-setup.md](./developer-guides/database-setup.md)** - Database schema and migration setup
- **[esp32-integration.md](./developer-guides/esp32-integration.md)** - ESP32 device integration guide
- **[gsm-integration.md](./developer-guides/gsm-integration.md)** - GSM device integration guide
- **[scada-integration.md](./developer-guides/scada-integration.md)** - SCADA protocol integration guide
- **[gis-setup.md](./developer-guides/gis-setup.md)** - GIS module setup and configuration

### API Documentation
Complete API reference and authentication details.

- **[endpoints.md](./api/endpoints.md)** - Complete API endpoint reference
- **[auth.md](./api/auth.md)** - Authentication and authorization mechanisms
- **[openapi.yaml](./api/openapi.yaml)** - OpenAPI specification (coming soon)

### Operations
Deployment, infrastructure, and operational procedures.

- **[deploy.md](./operations/deploy.md)** - Production deployment guide
- **[k3s-manifests.md](./operations/k3s-manifests.md)** - K3s deployment manifests and configuration
- **[k3s-setup.md](./operations/k3s-setup.md)** - K3s lightweight Kubernetes setup
- **[k3s-troubleshooting.md](./operations/k3s-troubleshooting.md)** - K3s troubleshooting guide
- **[docker-setup.md](./operations/docker-setup.md)** - Docker containerization and local setup
- **[dashboard-deployment.md](./operations/dashboard-deployment.md)** - Dashboard deployment procedures
- **[backup-restore.md](./operations/backup-restore.md)** - Backup and restore procedures
- **[influxdb-setup.md](./operations/influxdb-setup.md)** - InfluxDB time-series database setup

### User Guides
End-user documentation for using the WebSCADA platform.

- **[frontend-usage.md](./user-guides/frontend-usage.md)** - Frontend application user guide
- **[console-features.md](./user-guides/console-features.md)** - Console dashboard features and usage

### Migrations
Historical migration notes and implementation summaries.

- **[changelog.md](./migrations/changelog.md)** - Complete changelog of all migrations
- **[K8S-TO-K3S-MIGRATION.md](./migrations/K8S-TO-K3S-MIGRATION.md)** - Kubernetes to K3s migration guide
- **[DOCUMENTATION-REORGANIZATION-SUMMARY.md](./migrations/DOCUMENTATION-REORGANIZATION-SUMMARY.md)** - Documentation reorganization summary
- **[DOCUMENTATION-CLEANUP-2025-11-26.md](./migrations/DOCUMENTATION-CLEANUP-2025-11-26.md)** - Documentation cleanup and consolidation
- **[dashboard-implementation.md](./migrations/dashboard-implementation.md)** - Dashboard implementation notes
- **[console-cleanup.md](./migrations/console-cleanup.md)** - Console cleanup migration
- **[user-settings-implementation.md](./migrations/user-settings-implementation.md)** - User settings feature implementation
- **[initial-implementation.md](./migrations/initial-implementation.md)** - Initial system implementation notes
- **[testing-cleanup.md](./migrations/testing-cleanup.md)** - Testing and cleanup procedures
- **[cleanup-summary.md](./migrations/cleanup-summary.md)** - Overall cleanup summary

### Assets
Diagrams, images, and other documentation assets.

- **[images/diagrams/](./assets/images/diagrams/)** - Architecture diagrams and flowcharts

## Quick Start

If you're new to WebSCADA:

1. **Developers**: Start with [Developer Guides → Setup Local](./developer-guides/setup-local.md)
2. **DevOps**: See [Operations → Deploy](./operations/deploy.md)
3. **Users**: Check [User Guides → Frontend Usage](./user-guides/frontend-usage.md)
4. **Architecture**: Review [Architecture → Overview](./architecture/overview.md)

## Contributing to Documentation

When updating documentation:

1. Keep files organized in their respective directories
2. Use clear, descriptive filenames in kebab-case
3. Include a table of contents for documents longer than 200 lines
4. Add diagrams to `assets/images/diagrams/` and reference them
5. Update this README when adding new documentation files

## Documentation Standards

- **Format**: Markdown (.md)
- **Line Length**: Max 120 characters (soft limit)
- **Headings**: Use ATX-style headers (# Header)
- **Code Blocks**: Always specify language for syntax highlighting
- **Links**: Use relative links for internal documentation

## Need Help?

- Check the [Architecture Overview](./architecture/overview.md) for system understanding
- See [Contributing Guide](./developer-guides/contrib-guide.md) for development workflow
- Review [API Documentation](./api/endpoints.md) for API reference

---

**Last Updated**: 2025-11-26
**Documentation Version**: 2.1.0
