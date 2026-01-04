module.exports = {
	apps: [
		{
			name: 'beancode-telegram-bot',
			script: 'index.js',
			instances: 1,
			exec_mode: 'fork', // Явно указываем fork режим (не cluster)
			autorestart: true,
			watch: false,
			max_memory_restart: '200M',
			env: {
				NODE_ENV: 'production',
			},
			error_file: './logs/error.log',
			out_file: './logs/out.log',
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			merge_logs: true,
		},
	],
};
