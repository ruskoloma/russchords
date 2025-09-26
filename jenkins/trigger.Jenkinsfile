pipeline {
  agent any
  
  options { 
    timestamps() 
  }

  parameters {
    choice(name: 'ENV', choices: ['dev', 'prod'], description: 'Environment')
    string(name: 'REPO_URL', defaultValue: 'https://github.com/ruskoloma/russchords', description: 'Git repository URL')
  }

  stages {
    stage('Checkout branch') {
      steps {
            git branch: params.ENV == 'dev' ? 'develop' : 'master', url: params.REPO_URL
      }
    }

    stage('Trigger builds in parallel') {
      parallel {
        stage('Frontend if frontend/** changed') {
          when {
            changeset "frontend/**"
          }
          steps {
            echo "[trigger] Changes detected under frontend/** — triggering frontend build job"
            build job: "russchords-frontend-${params.ENV}",
              parameters: [
                choice(name: 'ENV', value: params.ENV),
                string(name: 'GIT_URL', value: params.REPO_URL),
                string(name: 'GIT_BRANCH', value: params.ENV == 'dev' ? 'develop' : 'master'),
              ],
              propagate: true,
              wait: true
          }
        }
        stage('Backend if backend/** changed') {
          when {
            changeset "backend/**"
          }
          steps {
            echo "[trigger] Changes detected under backend/** — triggering backend build job"
            build job: "russchords-backend-${params.ENV}",
              parameters: [
                choice(name: 'ENV', value: params.ENV),
                string(name: 'GIT_URL', value: params.REPO_URL),
                string(name: 'GIT_BRANCH', value: params.ENV == 'dev' ? 'develop' : 'master'),
              ],
              propagate: true,
              wait: true
          }
        }
        stage('Lambda if lambda/** changed') {
          when {
            changeset "lambda/**"
          }
          steps {
            echo "[trigger] Changes detected under lambda/** — triggering lambda build job"
            build job: "russchords-lambda-${params.ENV}",
              parameters: [
                choice(name: 'ENV', value: params.ENV),
                string(name: 'GIT_URL', value: params.REPO_URL),
                string(name: 'GIT_BRANCH', value: params.ENV == 'dev' ? 'develop' : 'master'),
              ],
              propagate: true,
              wait: true
          }
        }
      }
    }
  }

  post {
    success { echo "[ok] Trigger job finished" }
    unstable { echo "[warn] Trigger finished (unstable)" }
    failure { echo "[fail] Trigger failed" }
  }
}
