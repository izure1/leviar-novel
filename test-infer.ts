import config from './example/novel.config';
type Test = typeof config.assets;
// @ts-expect-error
const x: Test = 1;
