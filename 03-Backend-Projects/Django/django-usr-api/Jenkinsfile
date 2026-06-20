pipeline {
  agent { label 'k3s-worker' }

  environment {
    REGISTRY  = '10.0.0.206:5000'
    APP_NAME  = 'django-api'
    IMAGE     = "${REGISTRY}/${APP_NAME}"
    TAG       = "${GIT_COMMIT[0..7]}"
    NAMESPACE = 'django-api'
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
        echo "Building commit: ${TAG}"
      }
    }

    stage('Build') {
      steps {
        sh "docker build -t ${IMAGE}:${TAG} ."
        sh "docker tag ${IMAGE}:${TAG} ${IMAGE}:latest"
      }
    }

    stage('Push') {
      steps {
        sh "docker push ${IMAGE}:${TAG}"
        sh "docker push ${IMAGE}:latest"
      }
    }

    stage('Deploy') {
      steps {
        sh """
          kubectl set image deployment/django-api \
            django-api=${IMAGE}:${TAG} \
            -n ${NAMESPACE}

          kubectl set image deployment/django-api \
            migrate=${IMAGE}:${TAG} \
            -n ${NAMESPACE} \
            --containers=migrate || true

          kubectl rollout status deployment/django-api -n ${NAMESPACE} --timeout=120s
        """
      }
    }
  }

  post {
    success {
      echo "Deployed django-api:${TAG} successfully"
    }
    failure {
      echo "Pipeline failed - check logs above"
    }
  }
}