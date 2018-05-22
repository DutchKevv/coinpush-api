def call(Map pipelineParams) {
    node {
        stage('enable maintenance mode on nginx') {
            sh 'ls && sshpass -p Bettie123! ssh -o StrictHostKeyChecking=no kewin@coinpush.app cp /usr/src/app/server-nginx/server-nginx/pages/maintenance_off.html /usr/src/app/server-nginx/pages/maintenance_on.html'
        }
    }
}