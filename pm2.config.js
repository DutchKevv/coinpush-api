const path = require('path');

module.exports = [
  {
    script: 'server-gateway/index.js',
    name: 'gateway',
    env_production: {
      TZ: 'Europe/London',
      NODE_ENV: 'production'
    },
    env_development: {
      NODE_ENV: 'development'
    }
  },
  {
    script: path.join(__dirname, 'server-cache', 'index.js'),
    name: 'cache',
    env_production: {
      TZ: 'Europe/London',
      NODE_ENV: 'production'
    },
    env_development: {
      TZ: 'Europe/London',
      NODE_ENV: 'development'
    }
  },
  {
    script: 'server-user/index.js',
    name: 'user',
    env_production: {
      TZ: 'Europe/London',
      NODE_ENV: 'production'
    },
    env_development: {
      NODE_ENV: 'development'
    }
  },
  {
    script: 'server-comment/index.js',
    name: 'comment',
    env_production: {
      TZ: 'Europe/London',
      NODE_ENV: 'production'
    },
    env_development: {
      TZ: 'Europe/London',
      NODE_ENV: 'development'
    }
  },
  {
    script: 'server-notify/index.js',
    name: 'notify',
    env_production: {
      TZ: 'Europe/London',
      NODE_ENV: 'production'
    },
    env_development: {
      NODE_ENV: 'development'
    }
  },
  {
    script: 'server-event/index.js',
    name: 'event',
    env_production: {
      TZ: 'Europe/London',
      NODE_ENV: 'production'
    },
    env_development: {
      NODE_ENV: 'development'
    }
  }
]