def call(Map pipelineParams) {
    node {
        stage('disable maintenance mode on nginx') {
            sh 'sshpass -p Bettie123! ssh -o StrictHostKeyChecking=no kewin@coinpush.app rm -f /home/kewin/Projects/CoinPush/server-nginx/pages/maintenance_on.html'
        }
    }
}