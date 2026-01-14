module.exports = {
  apps: [{
    name: 'poly-mcp-arbitrage',
    script: 'src/index.js',
    cwd: process.env.HOME + '/poly-mcp',  // 自动使用用户 home 目录
    env_file: '.env',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
