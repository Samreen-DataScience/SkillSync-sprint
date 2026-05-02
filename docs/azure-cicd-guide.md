# SkillSync CI/CD and Azure Deployment Guide

This project is a Dockerized microservices application. The clean Azure flow is:

1. Push code to GitHub.
2. GitHub Actions runs CI tests and frontend build.
3. GitHub Actions builds Docker images.
4. Images are pushed to Azure Container Registry.
5. Azure Container Apps runs the frontend, gateway, services, and supporting containers.

## Recommended Azure Services

- Azure Container Registry: stores SkillSync Docker images.
- Azure Container Apps: runs the frontend and Spring Boot microservices.
- Azure Database for MySQL Flexible Server: production database option.
- Azure Cache for Redis: production Redis option.
- RabbitMQ: can be containerized for project demo, or replaced later with Azure Service Bus.

For a college/demo deployment, keeping MySQL, Redis, RabbitMQ, Eureka, and the services in containers is acceptable. For production, use managed Azure services for database/cache/messaging.

## GitHub Secrets and Variables

Create these GitHub repository secrets/variables before running the Azure workflow.

Secrets:

- `AZURE_CREDENTIALS`: service principal JSON used by `azure/login`.

Variables:

- `ACR_NAME`: Azure Container Registry name, for example `skillsyncregistry`.
- `ACR_LOGIN_SERVER`: ACR login server, for example `skillsyncregistry.azurecr.io`.
- `AZURE_RESOURCE_GROUP`: resource group name, for example `rg-skillsync`.
- `PUBLIC_API_URL`: public gateway URL, for example `https://skillsync-api-gateway.<region>.azurecontainerapps.io`.

## First-Time Azure Setup

Run these commands once from Azure CLI. Change names and region as needed.

```bash
az login
az group create --name rg-skillsync --location centralindia
az acr create --resource-group rg-skillsync --name skillsyncregistry --sku Basic
az containerapp env create --name skillsync-env --resource-group rg-skillsync --location centralindia
```

Create container apps once, then the GitHub Actions deploy workflow can update them. The first create step depends on your final database choice, so keep the initial setup manual and use the pipeline for repeat deployments.

## Local Docker Run

For local checking:

```bash
docker compose up -d --build
```

Open:

- Frontend: `http://localhost:5173`
- API Gateway: `http://localhost:8080`
- Eureka: `http://localhost:8761`

## Pipeline Files Added

- `.github/workflows/ci.yml`: runs backend Maven tests, frontend build, and compose validation.
- `.github/workflows/azure-container-apps.yml`: builds/pushes images to ACR and updates existing Azure Container Apps.

## Important Notes

- Do not put database passwords directly in GitHub workflow files.
- Use Azure/GitHub secrets for credentials.
- The frontend must be built with the deployed API Gateway URL, not `localhost`.
- In Azure, containers must communicate by Azure Container Apps internal DNS names or environment variables, not local machine ports.
