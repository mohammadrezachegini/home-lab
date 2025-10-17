pipeline{
    agent any
    stages{
        stage('Upstream Job'){
            steps{
                echo "This is upstream job"
            }
        }
        stage('Downstream Job'){
            steps{
                build job: 'Downstream-job'
            }
        }
    }
}
