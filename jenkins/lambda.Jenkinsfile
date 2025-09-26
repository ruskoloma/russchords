pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  parameters {
    choice(name: 'ENV', choices: ['dev', 'prod'], description: 'Environment')
    string(name: 'AWS_REGION', defaultValue: 'us-west-2', description: 'AWS region')
    string(name: 'REPO_URL', defaultValue: 'https://github.com/ruskoloma/russchords', description: 'Git repository URL')
  }

  stages {
    stage('Checkout') {
      steps {
        git branch: params.ENV == 'dev' ? 'develop' : 'master', url: params.REPO_URL
      }
    }

    stage('Load env from SSM') {
      steps {
        withAWSParameterStore(path: "/russchords/${params.ENV}/lambda", recursive: true, naming: 'relative', regionName: params.AWS_REGION) {
          script {
            env.AWS_REGION     = params.AWS_REGION
            env.FUNCTION_NAME  = "${FUNCTION_NAME}"
            env.CODE_BUCKET    = "${CODE_BUCKET}"
            env.CODE_KEY       = "${CODE_KEY}"
          }
        }
        sh '''
          set -e
          : "${FUNCTION_NAME:?SSM var FUNCTION_NAME is required}"
          : "${CODE_BUCKET:?SSM var CODE_BUCKET is required}"
          : "${CODE_KEY:?SSM var CODE_KEY is required}"
          echo "ENV OK: FUNCTION_NAME=$FUNCTION_NAME, CODE_BUCKET=$CODE_BUCKET, CODE_KEY=$CODE_KEY, AWS_REGION=$AWS_REGION"
        '''
      }
    }

    stage('Install dependencies') {
      steps {
        sh '''
          set -eu
          cd lambda
          echo "Installing npm dependencies..."
          npm ci --only=production
          echo "Dependencies installed successfully"
          cd ..
        '''
      }
    }

    stage('Zip artifact') {
      steps {
        sh '''
          set -eu
          cd lambda
          rm -f ../artifact.zip
          zip -yrq ../artifact.zip ./*
          cd ..
          echo "ZIP ready:"
          du -h artifact.zip || true
        '''
      }
    }

    stage('Upload to S3') {
      steps {
        sh '''
          set -eu
          echo "Uploading artifact.zip to s3://$CODE_BUCKET/$CODE_KEY"
          aws s3 cp artifact.zip "s3://$CODE_BUCKET/$CODE_KEY" --region "$AWS_REGION" --only-show-errors
        '''
      }
    }

    stage('Update Lambda code') {
      steps {
        sh '''
          set -eu
          echo "Updating Lambda $FUNCTION_NAME from s3://$CODE_BUCKET/$CODE_KEY"
          aws lambda update-function-code \
            --function-name "$FUNCTION_NAME" \
            --s3-bucket "$CODE_BUCKET" \
            --s3-key "$CODE_KEY" \
            --publish \
            --region "$AWS_REGION" > .update.json

          echo "Update response summary:"
          (jq '{FunctionName,Version,LastModified,CodeSha256}' .update.json) || cat .update.json
        '''
      }
    }
  }

  post {
    success {
      echo 'Lambda deployed successfully.'
    }
    failure {
      echo 'Deployment failed.'
    }
  }
}