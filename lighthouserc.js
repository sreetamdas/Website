module.exports = {
  ci: {
    collect: {
      staticDistDir: '.next',
    },
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'csp-xss': 'warn',
      },
    },
  },
};
