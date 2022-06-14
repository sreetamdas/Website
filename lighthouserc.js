module.exports = {
  ci: {
    collect: {
      staticDistDir: '.next',
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'csp-xss': 'warn',
      },
    },
  },
};
