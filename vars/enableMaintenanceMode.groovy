def call(Map pipelineParams) {
    node {
        stage('enable maintenance mode on nginx') {
            sh 'sshpass -p Bettie123! ssh -o StrictHostKeyChecking=no kewin@coinpush.app cp /home/kewin/Projects/CoinPush/server-nginx/pages/maintenance_off.html /home/kewin/Projects/CoinPush/server-nginx/pages/maintenance_on.html'
        }
    }
}