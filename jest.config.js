/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  resetMocks: true,
  globals: {
    __LIB_VERSION__: 'test',
    __LIB_REPO_URL__: 'test url',
  },
};
