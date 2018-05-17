node {
    agent any
    stage('clean workspace') {
        cleanWs()
    }
    stage('get source') {
        git branch: 'development', url: 'https://github.com/DutchKevv/TradeJS'
    }
    stage('build docker container') {
        sh 'npm run build-prod-client'
    }
    stage('build client through docker') {
        sh 'npm run prod-client'
    }
    stage('remove docker container') {
        sh 'docker rm client'
    }
}