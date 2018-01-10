
export const syncer = function (redisClient) {
    redisClient
}

module.exports = {

    symbols: [],

    start(redisClient) {
        redisClient.subscribe("symbol-update");
        redisClient.subscribe("symbol-tick");

        redisClient.on("message", (channel, message) => {
            let data;

            try {
                data = JSON.parse(message);
            } catch (error) {
                return console.error(error);
            }

            switch (channel) {
                case 'symbol-update':
                    console.log(data);
                case 'ticks':
                    console.log(data);
                    break;
                case 'bar':
                    break;
            }
        });
    }
}