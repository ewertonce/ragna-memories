module.exports = {
  // Tests manage their own jsdom windows (see tests/helpers/loadGame.js) so
  // each test gets a fresh, isolated realm for game.js's top-level state.
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  verbose: true,
};
