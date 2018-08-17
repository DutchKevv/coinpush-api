def call(Map pipelineParams) {
    node {
        stage('install client dependencies (production)') {
            dir('client') {
                sh 'npm i --silent --production --no-progress && npm run build-prod'
            }
        }
        stage('build client (production)') {
            dir ('client') {
                sh 'npm run build-prod'
            }
        }
        // stage('build docker container') {
        //     sh 'npm run build-prod-client'
        // }
        // stage('build client through docker') {
        //     sh 'docker-compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache client'
        //     sh 'docker-compose -f docker-compose.yml -f docker-compose.prod.yml up client'
        // }
        // stage('remove docker container') {
        //     // sh 'docker rm client'
        // }
    }
}