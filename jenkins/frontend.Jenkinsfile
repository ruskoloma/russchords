pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  parameters {
    choice(name: 'ENV', choices: ['dev', 'prod'], description: 'Environment')
    string(name: 'AWS_REGION', defaultValue: 'us-west-2')
    string(name: 'IMAGE_TAG', defaultValue: 'latest')
    string(name: 'REPO_URL', defaultValue: 'https://github.com/ruskoloma/russchords', description: 'Git repository URL')
  }

  stages {
    stage('Load ENV from SSM') {
        steps {
            withAWSParameterStore(path: "/russchords/${params.ENV}/frontend", recursive: true, naming: 'relative', regionName: params.AWS_REGION) {
                script {
                  env.AWS_REGION                        = "${params.AWS_REGION}"
                  env.S3_BUCKET                         = "${BUILD_S3_BUCKET ?: error('S3_BUCKET not set in SSM')}"
                  env.CF_DIST_ID                        = "${BUILD_CF_DIST_ID}"
                  env.VITE_API_URL                      = "${VITE_API_URL}"
                  env.VITE_LAMBDA_PARSER_DOMAIN         = "${VITE_LAMBDA_PARSER_DOMAIN}"
                  env.VITE_COGNITO_AUTHORITY            = "${VITE_COGNITO_AUTHORITY}"
                  env.VITE_COGNITO_CLIENT_ID            = "${VITE_COGNITO_CLIENT_ID}"
                  env.VITE_COGNITO_REDIRECT_URI         = "${VITE_COGNITO_REDIRECT_URI}"
                  env.VITE_COGNITO_LOGOUT_URI           = "${VITE_COGNITO_LOGOUT_URI}"
                  env.VITE_COGNITO_DOMAIN               = "${VITE_COGNITO_DOMAIN}"
                  env.VITE_COGNITO_SILENT_REDIRECT_URI  = "${VITE_COGNITO_SILENT_REDIRECT_URI}"
                  env.VITE_COGNITO_SCOPE                = "${VITE_COGNITO_SCOPE}"
                  env.VITE_GOOGLE_SEARCH_KEY            = "${VITE_GOOGLE_SEARCH_KEY}"
                  env.VITE_GOOGLE_SEARCH_CX             = "${VITE_GOOGLE_SEARCH_CX}"
                  env.VITE_GTM_ID                       = "${VITE_GTM_ID}"

                  def required = [
                    'AWS_REGION',
                    'S3_BUCKET',
                    'CF_DIST_ID',
                    'VITE_API_URL',
                    'VITE_LAMBDA_PARSER_DOMAIN',
                    'VITE_COGNITO_AUTHORITY',
                    'VITE_COGNITO_CLIENT_ID',
                    'VITE_COGNITO_REDIRECT_URI',
                    'VITE_COGNITO_LOGOUT_URI',
                    'VITE_COGNITO_DOMAIN',
                    'VITE_COGNITO_SILENT_REDIRECT_URI',
                    'VITE_COGNITO_SCOPE',
                    'VITE_GOOGLE_SEARCH_KEY',
                    'VITE_GOOGLE_SEARCH_CX',
                    'VITE_GTM_ID'
                  ]

                  def missing = required.findAll { k -> !(env."$k"?.trim()) }
                  if (missing) {
                    error "Missing required ENV: ${missing.join(', ')}"
                  }
                }
            }
        }
    }

    
    stage('Checkout') {
      steps {
        git branch: params.ENV == 'dev' ? 'develop' : 'master', url: params.REPO_URL
      }
    }

    stage('Build frontend') {
      steps {
        dir('frontend') {
          sh '''#!/bin/bash
          set -euo pipefail

          echo "[info] Node: $(node -v), npm: $(npm -v)"
          npm ci --no-audit --no-fund
          npm run build
          test -d "dist" || { echo "[error] 'dist' not found"; exit 1; }
          '''
        }
      }
    }

    stage('Deploy to S3') {
      steps {
        dir('frontend') {
          sh '''#!/bin/bash
          set -euo pipefail

          BUILD_DIR="dist"

          echo "[s3] sync static (exclude *.html, long cache)"
          aws s3 sync "$BUILD_DIR/" "s3://${S3_BUCKET}/" \
            --delete \
            --exclude "*.html" \
            --cache-control "public,max-age=31536000,immutable"

          echo "[s3] upload *.html (no-cache)"

          shopt -s nullglob
          for html in "$BUILD_DIR"/*.html; do
            aws s3 cp "$html" "s3://${S3_BUCKET}/$(basename "$html")" \
              --cache-control "no-cache, no-store, must-revalidate" \
              --content-type "text/html; charset=utf-8"
          done

          shopt -u nullglob
          for f in "manifest.json" "manifest.webmanifest" "service-worker.js" "sw.js" "workbox-*.js" "asset-manifest.json"; do
            for p in "$BUILD_DIR"/$f; do
              [[ -f "$p" ]] || continue
              aws s3 cp "$p" "s3://${S3_BUCKET}/$(basename "$p")" \
                --cache-control "no-cache, no-store, must-revalidate"
            done
          done
          '''
        }
      }
    }

    stage('CloudFront Invalidation') {
      steps {
        sh '''#!/bin/bash
        set -euo pipefail

        echo "[cf] create invalidation /*"

        aws cloudfront create-invalidation \
          --distribution-id "${CF_DIST_ID}" \
          --paths "/*" >/dev/null

        echo "[done] CloudFront invalidation requested"
        '''
      }
    }
  }

  post {
    success { echo '[done] Deploy complete' }
    failure { echo '[fail] Deploy failed' }
  }
}
