pipeline {
  agent any
  
  options { 
    timestamps() 
  }
 
  environment {
    REPO_BRANCH = 'stage'
    REPO_URL = 'https://github.com/ruskoloma/russchords'
  }

  stages {
    stage('Checkout stage branch') {
      steps {
            git branch: env.REPO_BRANCH, url: env.REPO_URL
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
            build job: 'russchords-frontend-stage',
              parameters: [
                string(name: 'GIT_URL', value: env.REPO_URL),
                string(name: 'GIT_BRANCH', value: env.REPO_BRANCH),
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
            build job: 'russchords-backend-stage',
              parameters: [
                string(name: 'GIT_URL', value: env.REPO_URL),
                string(name: 'GIT_BRANCH', value: env.REPO_BRANCH),
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
