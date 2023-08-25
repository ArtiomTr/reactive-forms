module.exports = {
	withoutPublish: true,
	tempDir: 'prepared-package',
	packageManager: 'pnpm',
	files: [
		'src',
		'.storybook',
		'aqu.config.json',
		'tsconfig.json',
		'.turbo',
		'stories',
		'coverage',
		'tests',
		'tsconfig.test.json',
	],
	fields: ['scripts'],
};
