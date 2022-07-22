const simpleGit = require('simple-git');

const handleGitOps = async () => {
  const git = simpleGit();
  git
    .addConfig('user.name', 'Shubham Verma')
    .addConfig(
      'user.email',
      '25576658+ShubhamVerma1811@users.noreply.github.com',
    )
    .pull('origin', 'master', {}, (err) => {
      if (err) {
        console.log('PULL ERROR', err);
      } else {
        console.log('PULL SUCCESS');
      }
    })
    .add('.', (err) => {
      if (err) {
        console.log('ADD ERROR', err);
      } else {
        console.log('ADD SUCCESS');
      }
    })
    .commit(`Pull masteer`, (err) => {
      if (err) {
        console.error('COMMIT ERROR', err);
      } else {
        console.log('COMMIT SUCCESS');
      }
    })
    .push('origin', 'lhci', {}, (err) => {
      if (err) {
        console.error('PUSH ERROR', err);
      } else {
        console.log('Successfully pushed to github');
      }
    });
};

const main = async () => {
  await handleGitOps();
};

main();
