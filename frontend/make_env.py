#!/usr/bin/env python3
import os
import boto3
from boto3.session import Session
from botocore.exceptions import ProfileNotFound

# Hardcoded base path
SSM_BASE = "/russchords/dev"

# Map env var -> relative SSM name
PARAMS = {
    "VITE_COGNITO_AUTHORITY":            "frontend/vite-cognito-authority",
    "VITE_API_URL":                      "frontend/vite-api-url",
    "VITE_COGNITO_CLIENT_ID":            "frontend/vite-cognito-client-id",
    "VITE_COGNITO_REDIRECT_URI":         "frontend/vite-cognito-redirect-uri",
    "VITE_COGNITO_LOGOUT_URI":           "frontend/vite-cognito-logout-uri",
    "VITE_COGNITO_SILENT_REDIRECT_URI":  "frontend/vite-cognito-silent-redirect-uri",
    "VITE_COGNITO_DOMAIN":               "frontend/vite-cognito-domain",
    "VITE_COGNITO_SCOPE":                "frontend/vite-cognito-scope",
    "VITE_GOOGLE_SEARCH_KEY":            "frontend/vite-google-search-key",
    "VITE_GOOGLE_SEARCH_CX":             "frontend/vite-google-search-cx",
    "VITE_LAMBDA_PARSER_DOMAIN":         "frontend/vite-lambda-parser-domain",
}

def main():
    # Prefer SSO profile if available; fall back to default credentials
    profile = os.getenv("AWS_PROFILE", "russchords-admin")
    try:
        session = Session(profile_name=profile)
    except ProfileNotFound:
        session = boto3.session.Session()
    ssm = session.client("ssm", region_name="us-west-2")

    with open(".env", "w", encoding="utf-8") as f:
        for env_key, rel in PARAMS.items():
            name = f"{SSM_BASE}/{rel}"
            try:
                resp = ssm.get_parameter(Name=name, WithDecryption=True)
                value = resp["Parameter"]["Value"]
                f.write(f"{env_key}={value}\n")
                print(f"[OK] {env_key}")
            except Exception as e:
                print(f"[WARN] Could not fetch {name}: {e}")

if __name__ == "__main__":
    main()