def call(Map pipelineParams) {
    node {
        stage('enable maintenance mode on nginx') {
            sh 'ls && sshpass -p Bettie123! ssh -o StrictHostKeyChecking=no kewin@coinpush.app cp /home/kewin/Projects/TradeJS/server-nginx/pages/maintenance_off.html /home/kewin/Projects/TradeJS/server-nginx/pages/maintenance_on.html'
        }
    }
}