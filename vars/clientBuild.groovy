def call(Map pipelineParams) {
    node {
        // stage('clean workspace') {
        //     cleanWs()
        // }
        stage('get source') {
            // checkout scm
            sh 'ls && echo ${pwd}'
            // load 'server-jenkins/pipelines/client-prod-build/Jenkinsfile'
        }
        
        // stage('get source') {
        //     git branch: 'development', url: 'https://github.com/DutchKevv/TradeJS'
        // }
        stage('build docker container') {
            sh 'ls && npm run build-prod-client'
        }
        stage('build client through docker') {
            sh 'ls && npm run prod-client'
        }
        stage('remove docker container') {
            sh 'docker rm client'
        }
    }
}