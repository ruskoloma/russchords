#!/usr/bin/env python3

# SSM seeder for russchords. Requires: pip install boto3
# Usage:
#   cp ./fill-parameter-store.py ./ssm_sync.py
#   python3 ssm_sync.py --env prod --region us-west-2 --profile russchords-admin
#   python3 ssm_sync.py // will run dev env in us-west-2 as russchords-admin

import argparse, sys
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

PARAMS = [
  # ---- Backend
  {"path":"/russchords/[env]/backend/aspnetcore/environment","env_name":"ASPNETCORE_ENVIRONMENT","desc":"ASP.NET Core environment","example":"Production","type":"String"},
  {"path":"/russchords/[env]/backend/aws-account-id","env_name":"AWS_ACCOUNT_ID","desc":"AWS account ID used in builds and scripts","example":"123456789012","type":"String"},
  {"path":"/russchords/[env]/backend/aws-region","env_name":"AWS_REGION","desc":"Region for backend deployment (optional, may rely on shared)","example":"us-west-2","type":"String"},
  {"path":"/russchords/[env]/backend/codebuild-project","env_name":"CODEBUILD_PROJECT","desc":"Name of CodeBuild project","example":"russchords-backend-build","type":"String"},
  {"path":"/russchords/[env]/backend/db/connection_string","env_name":"ConnectionStrings__DefaultConnection","desc":"Database connection string for backend","example":"Host=db.internal;Port=5432;Database=app;Username=app;Password=p@ss;","type":"SecureString"},
  {"path":"/russchords/[env]/backend/ecr-repo","env_name":"ECR_REPO","desc":"ECR repository for backend image","example":"russchords/backend-api","type":"String"},
  {"path":"/russchords/[env]/backend/ecs-cluster","env_name":"ECS_CLUSTER","desc":"ECS cluster name","example":"russchords-stage","type":"String"},
  {"path":"/russchords/[env]/backend/ecs-service","env_name":"ECS_SERVICE","desc":"ECS service name for backend","example":"backend-service","type":"String"},

  # ---- Frontend (Build CI)
  {"path":"/russchords/[env]/frontend/build/aws-region","env_name":"AWS_REGION","desc":"AWS region used for S3/CloudFront","example":"us-west-2","type":"String"},
  {"path":"/russchords/[env]/frontend/build/s3-bucket","env_name":"S3_BUCKET","desc":"Bucket for build artifacts","example":"russchords-stage","type":"String"},
  {"path":"/russchords/[env]/frontend/build/cf-dist-id","env_name":"CF_DIST_ID","desc":"CloudFront distribution ID for invalidation","example":"E2ABCDEF123456","type":"String"},

  # ---- Frontend (Vite)
  {"path":"/russchords/[env]/frontend/vite/api-url","env_name":"VITE_API_URL","desc":"Base URL of backend API","example":"https://api.example.com","type":"String"},
  {"path":"/russchords/[env]/frontend/vite/cognito/authority","env_name":"VITE_COGNITO_AUTHORITY","desc":"Cognito authority/issuer","example":"https://cognito-idp.us-west-2.amazonaws.com/us-west-2_XXXX","type":"String"},
  {"path":"/russchords/[env]/frontend/vite/cognito/client-id","env_name":"VITE_COGNITO_CLIENT_ID","desc":"Cognito app client ID","example":"1abc2def3ghi4jkl5","type":"String"},
  {"path":"/russchords/[env]/frontend/vite/cognito/domain","env_name":"VITE_COGNITO_DOMAIN","desc":"Cognito Hosted UI domain","example":"https://auth.example.com","type":"String"},
  {"path":"/russchords/[env]/frontend/vite/cognito/logout-uri","env_name":"VITE_COGNITO_LOGOUT_URI","desc":"Redirect URI after logout","example":"https://stage.example.com","type":"String"},
  {"path":"/russchords/[env]/frontend/vite/cognito/redirect-uri","env_name":"VITE_COGNITO_REDIRECT_URI","desc":"Redirect URI after login","example":"https://stage.example.com/auth/callback","type":"String"},
  {"path":"/russchords/[env]/frontend/vite/cognito/scope","env_name":"VITE_COGNITO_SCOPE","desc":"OpenID scopes","example":"openid email profile","type":"String"},
  {"path":"/russchords/[env]/frontend/vite/cognito/silent-redirect-uri","env_name":"VITE_COGNITO_SILENT_REDIRECT_URI","desc":"Silent renew redirect URI","example":"https://stage.example.com/auth/silent-redirect","type":"String"},
  {"path":"/russchords/[env]/frontend/vite/lambda-parser-domain","env_name":"VITE_LAMBDA_PARSER_DOMAIN","desc":"Domain used by lambda parser","example":"example.com","type":"String"},
  {"path":"/russchords/[env]/frontend/vite/google/search-cx","env_name":"VITE_GOOGLE_SEARCH_CX","desc":"Google custom search CX ID","example":"a1b2c3d4e5f6g7h8","type":"String"},
  {"path":"/russchords/[env]/frontend/vite/google/search-key","env_name":"VITE_GOOGLE_SEARCH_KEY","desc":"Google API key","example":"AIza...xyz","type":"SecureString"},

  # ---- Nginx Proxy
  {"path":"/russchords/[env]/nginx-proxy/cluster_record_name","env_name":"CLUSTER_RECORD_NAME","desc":"DNS A record name for proxy","example":"proxy","type":"String"},
  {"path":"/russchords/[env]/nginx-proxy/eip_tag","env_name":"EIP_TAG","desc":"Tag used to identify Elastic IP","example":"NginxProxyEIP","type":"String"},
  {"path":"/russchords/[env]/nginx-proxy/zone_name","env_name":"ZONE_NAME","desc":"DNS zone name","example":"static.example.local","type":"String"},
  {"path":"/russchords/[env]/nginx-proxy/api_pass_host","env_name":"API_PASS_HOST","desc":"Api upstream domain and port that Nginx proxies requests to","example":"api.example.com","type":"String"},
  {"path":"/russchords/[env]/nginx-proxy/jenkins_pass_host","env_name":"JENKINS_PASS_HOST","desc":"Jenkins upstream domain and port that Nginx proxies requests to","example":"jenkins.example.com","type":"String"},
  {"path":"/russchords/[env]/nginx-proxy/domain","env_name":"DOMAIN","desc":"Main domain served by Nginx reverse proxy","example":"example.com","type":"String"},
  {"path":"/russchords/[env]/nginx-proxy/url","env_name":"URL","desc":"The same as domain, needed by nginx","example":"example.com","type":"String"},
  {"path":"/russchords/[env]/nginx-proxy/subdomains","env_name":"SUBDOMAINS","desc":"Comma-separated list of enabled subdomains","example":"api,jenkins","type":"String"},
  {"path":"/russchords/[env]/nginx-proxy/validation","env_name":"VALIDATION","desc":"Validation method for certificates (http or dns)","example":"http","type":"String"},
  {"path":"/russchords/[env]/nginx-proxy/only_subdomains","env_name":"ONLY_SUBDOMAINS","desc":"Restrict certificate issuance to subdomains only","example":"TRUE","type":"String"},
  {"path":"/russchords/[env]/nginx-proxy/email","env_name":"EMAIL","desc":"Email address for certificate registration and notifications","example":"email@gmail.com","type":"String"},

  # ---- Postgres
  {"path":"/russchords/[env]/postgres/db","env_name":"POSTGRES_DB","desc":"Initial database name","example":"appdb","type":"String"},
  {"path":"/russchords/[env]/postgres/password","env_name":"POSTGRES_PASSWORD","desc":"Database superuser password","example":"S0meStrongP@ss","type":"SecureString"},
  {"path":"/russchords/[env]/postgres/user","env_name":"POSTGRES_USER","desc":"Database superuser username","example":"appuser","type":"String"},

  # ---- Shared
  {"path":"/russchords/[env]/shared/aws/region","env_name":"AWS_REGION","desc":"Global AWS region for all services","example":"us-west-2","type":"String"},
  {"path":"/russchords/[env]/shared/cognito/authority","env_name":"COGNITO__AUTHORITY / VITE_COGNITO_AUTHORITY","desc":"Shared Cognito authority","example":"https://cognito-idp.us-west-2.amazonaws.com/us-west-2_XXXX","type":"String"},
  {"path":"/russchords/[env]/shared/cognito/client_id","env_name":"COGNITO__CLIENTID / VITE_COGNITO_CLIENT_ID","desc":"Shared Cognito client ID","example":"1abc2def3ghi4jkl5","type":"String"},
  {"path":"/russchords/[env]/shared/proxy/http","env_name":"HTTP_PROXY","desc":"HTTP proxy URL","example":"http://proxy.internal.local:8888","type":"String"},
  {"path":"/russchords/[env]/shared/proxy/https","env_name":"HTTPS_PROXY","desc":"HTTPS proxy URL","example":"http://proxy.internal.local:8888","type":"String"},
  {"path":"/russchords/[env]/shared/proxy/no_proxy","env_name":"NO_PROXY","desc":"Comma-separated list of no-proxy hosts","example":"169.254.169.254,127.0.0.1,.svc,.cluster.local","type":"String"},
  {"path":"/russchords/[env]/shared/proxy/java_opts","env_name":"JAVA_OPTS","desc":"JVM proxy/nonProxyHosts config","example":"-Dhttp.proxyHost=proxy.internal.local -Dhttp.proxyPort=8888 -Dhttp.nonProxyHosts=localhost|127.0.0.1|*.svc|*.cluster.local","type":"String"},
]

def upsert(ssm, name, value, ptype, desc, tags):
  kwargs = {"Name":name, "Value":value, "Type":ptype, "Overwrite":True, "Tier":"Standard",
            "Tags":[{"Key":k,"Value":v} for k,v in tags.items()], "Description":desc[:1024]}
  ssm.put_parameter(**kwargs)

def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--env", default="dev")
  ap.add_argument("--region", default="us-west-2")
  ap.add_argument("--profile", default="russchords-admin")
  args = ap.parse_args()

  sess = boto3.Session(profile_name=args.profile) if args.profile else boto3.Session()
  ssm = sess.client("ssm", region_name=args.region, config=Config(retries={"max_attempts":10,"mode":"standard"}))
  tags = {"Project":"russchords","Env":args.env}

  errors = 0
  for p in PARAMS:
    path = p["path"].replace("[env]", args.env)
    val  = p["example"]
    typ  = "SecureString" if p["type"].lower()=="securestring" else "String"
    desc = p["desc"]

    try:
      upsert(ssm, path, val, typ, desc, tags)
      print(f"[OK ] {typ:<12} {path}")
    except ClientError as e:
      errors += 1
      print(f"[ERR] {path}: {e}", file=sys.stderr)

  if errors: sys.exit(1)
  print("All parameters synced.")

if __name__ == "__main__":
  main()