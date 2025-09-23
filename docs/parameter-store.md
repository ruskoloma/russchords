# Parameter Store Layout

This document describes the structure of AWS SSM Parameter Store for the Russchords project.  
Parameters are organized under `/russchords/[env]/...` where `[env]` is `dev`, `stage`, or `prod`.  

Columns:
- **SSM Path**: Full parameter path with `[env]`.
- **ENV NAME**: The environment variable name used in tasks/builds.
- **Description**: Purpose of the variable.
- **Example Value**: Example placeholder value.
- **Type**: String or SecureString.

---

## Backend

| SSM Path | ENV NAME | Description | Example Value | Type |
|----------|----------|-------------|---------------|------|
| `/russchords/[env]/backend/aspnetcore/environment` | `ASPNETCORE_ENVIRONMENT` | ASP.NET Core environment | `Production` | String |
| `/russchords/[env]/backend/aws-account-id` | `AWS_ACCOUNT_ID` | AWS account ID used in builds and scripts | `123456789012` | String |
| `/russchords/[env]/backend/aws-region` | `AWS_REGION` | Region for backend deployment (optional, may rely on shared) | `us-west-2` | String |
| `/russchords/[env]/backend/codebuild-project` | `CODEBUILD_PROJECT` | Name of CodeBuild project | `russchords-backend-build` | String |
| `/russchords/[env]/backend/db/connection_string` | `ConnectionStrings__DefaultConnection` | Database connection string for backend | `Host=db.internal;Port=5432;Database=app;Username=app;Password=p@ss;` | SecureString |
| `/russchords/[env]/backend/ecr-repo` | `ECR_REPO` | ECR repository for backend image | `russchords/backend-api` | String |
| `/russchords/[env]/backend/ecs-cluster` | `ECS_CLUSTER` | ECS cluster name | `russchords-stage` | String |
| `/russchords/[env]/backend/ecs-service` | `ECS_SERVICE` | ECS service name for backend | `backend-service` | String |

---

## Frontend (Build CI)

| SSM Path | ENV NAME | Description | Example Value | Type |
|----------|----------|-------------|---------------|------|
| `/russchords/[env]/frontend/build/aws-region` | `AWS_REGION` | AWS region used for S3/CloudFront | `us-west-2` | String |
| `/russchords/[env]/frontend/build/s3-bucket` | `S3_BUCKET` | Bucket for build artifacts | `russchords-stage` | String |
| `/russchords/[env]/frontend/build/cf-dist-id` | `CF_DIST_ID` | CloudFront distribution ID for invalidation | `E2ABCDEF123456` | String |

---

## Frontend (Vite Variables)

| SSM Path | ENV NAME | Description | Example Value | Type |
|----------|----------|-------------|---------------|------|
| `/russchords/[env]/frontend/vite/api-url` | `VITE_API_URL` | Base URL of backend API | `https://api.example.com` | String |
| `/russchords/[env]/frontend/vite/cognito/authority` | `VITE_COGNITO_AUTHORITY` | Cognito authority/issuer | `https://cognito-idp.us-west-2.amazonaws.com/us-west-2_XXXX` | String |
| `/russchords/[env]/frontend/vite/cognito/client-id` | `VITE_COGNITO_CLIENT_ID` | Cognito app client ID | `1abc2def3ghi4jkl5` | String |
| `/russchords/[env]/frontend/vite/cognito/domain` | `VITE_COGNITO_DOMAIN` | Cognito Hosted UI domain | `https://auth.example.com` | String |
| `/russchords/[env]/frontend/vite/cognito/logout-uri` | `VITE_COGNITO_LOGOUT_URI` | Redirect URI after logout | `https://stage.example.com` | String |
| `/russchords/[env]/frontend/vite/cognito/redirect-uri` | `VITE_COGNITO_REDIRECT_URI` | Redirect URI after login | `https://stage.example.com/auth/callback` | String |
| `/russchords/[env]/frontend/vite/cognito/scope` | `VITE_COGNITO_SCOPE` | OpenID scopes | `openid email profile` | String |
| `/russchords/[env]/frontend/vite/cognito/silent-redirect-uri` | `VITE_COGNITO_SILENT_REDIRECT_URI` | Silent renew redirect URI | `https://stage.example.com/auth/silent-redirect` | String |
| `/russchords/[env]/frontend/vite/lambda-parser-domain` | `VITE_LAMBDA_PARSER_DOMAIN` | Domain used by lambda parser | `example.com` | String |
| `/russchords/[env]/frontend/vite/google/search-cx` | `VITE_GOOGLE_SEARCH_CX` | Google custom search CX ID | `a1b2c3d4e5f6g7h8` | String |
| `/russchords/[env]/frontend/vite/google/search-key` | `VITE_GOOGLE_SEARCH_KEY` | Google API key | `AIza...xyz` | SecureString |

---

## Nginx Proxy

| SSM Path | ENV NAME | Description | Example Value | Type |
|----------|----------|-------------|---------------|------|
| `/russchords/[env]/nginx-proxy/cluster_record_name` | `CLUSTER_RECORD_NAME` | DNS A record name for proxy | `proxy` | String |
| `/russchords/[env]/nginx-proxy/eip_tag` | `EIP_TAG` | Tag used to identify Elastic IP | `NginxProxyEIP` | String |
| `/russchords/[env]/nginx-proxy/zone_name` | `ZONE_NAME` | DNS zone name | `static.example.local` | String |
| `/russchords/[env]/nginx-proxy/proxy_pass_domain` | `PROXY_PASS_DOMAIN` | Upstream domain and port that Nginx proxies requests to | `russchords.local:8080` | String |
| `/russchords/[env]/nginx-proxy/domain` | `DOMAIN` | Main domain served by Nginx reverse proxy | `example.com` | String |
| `/russchords/[env]/nginx-proxy/subdomains` | `SUBDOMAINS` | Comma-separated list of enabled subdomains | `api,jenkins` | String |
| `/russchords/[env]/nginx-proxy/validation` | `VALIDATION` | Validation method for certificates (http or dns) | `http` | String |
| `/russchords/[env]/nginx-proxy/only_subdomains` | `ONLY_SUBDOMAINS` | Restrict certificate issuance to subdomains only | `TRUE` | String |
| `/russchords/[env]/nginx-proxy/email` | `EMAIL` | Email address for certificate registration and notifications | `email@gmail.com` | String |
| `/russchords/[env]/nginx-proxy/url` | `URL` | Base URL served by proxy | `example.com` | String |

---

## Postgres (Container Environment)

| SSM Path | ENV NAME | Description | Example Value | Type |
|----------|----------|-------------|---------------|------|
| `/russchords/[env]/postgres/db` | `POSTGRES_DB` | Initial database name | `appdb` | String |
| `/russchords/[env]/postgres/password` | `POSTGRES_PASSWORD` | Database superuser password | `S0meStrongP@ss` | SecureString |
| `/russchords/[env]/postgres/user` | `POSTGRES_USER` | Database superuser username | `appuser` | String |

---

## Shared (Global)

| SSM Path | ENV NAME | Description | Example Value | Type |
|----------|----------|-------------|---------------|------|
| `/russchords/[env]/shared/aws/region` | `AWS_REGION` | Global AWS region for all services | `us-west-2` | String |
| `/russchords/[env]/shared/cognito/authority` | `COGNITO__AUTHORITY` (backend) / `VITE_COGNITO_AUTHORITY` (frontend) | Shared Cognito authority | `https://cognito-idp.us-west-2.amazonaws.com/us-west-2_XXXX` | String |
| `/russchords/[env]/shared/cognito/client_id` | `COGNITO__CLIENTID` (backend) / `VITE_COGNITO_CLIENT_ID` (frontend) | Shared Cognito client ID | `1abc2def3ghi4jkl5` | String |
| `/russchords/[env]/shared/proxy/http` | `HTTP_PROXY` | HTTP proxy URL | `http://proxy.internal.local:8888` | String |
| `/russchords/[env]/shared/proxy/https` | `HTTPS_PROXY` | HTTPS proxy URL | `http://proxy.internal.local:8888` | String |
| `/russchords/[env]/shared/proxy/no_proxy` | `NO_PROXY` | Comma-separated list of no-proxy hosts | `169.254.169.254,127.0.0.1,.svc,.cluster.local` | String |
| `/russchords/[env]/shared/proxy/java_opts` | `JAVA_OPTS` (Jenkins/Java apps) | JVM proxy/nonProxyHosts config | `-Dhttp.proxyHost=proxy.internal.local -Dhttp.proxyPort=8888 -Dhttp.nonProxyHosts=localhost|127.0.0.1|*.svc|*.cluster.local` | String |

---