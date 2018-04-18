const phantom = require('phantom');
const exec = require('child_process').exec;

const URL_TO_VISIT = 'https://projects.fivethirtyeight.com/trump-approval-ratings/';
const URL_TO_POST = 'https://ifttj.wong2.me/Sk09tE7hM';

const exec_sync = async (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(error);
        reject();
      }

      resolve();
    });
  });
};

(async () => {
  console.log(`Start retrieving ${URL_TO_VISIT}`);
  const instance = await phantom.create();
  const page = await instance.createPage();
  const status = await page.open(URL_TO_VISIT, {
    encoding: 'utf8',
    gzip: true
  });
  console.log('Status: ' + status);

  const postData = await page.evaluate(function () {
    const chart = document.querySelector('div.chart');
    const approved = chart.childNodes[0].getElementsByClassName('label approve fg')[0].childNodes[0].textContent;
    const disapproved = chart.childNodes[0].getElementsByClassName('label disapprove fg')[0].childNodes[0].textContent;
    const day = chart.childNodes[0].getElementsByClassName('mouse-guide')[0].childNodes[0].textContent;

    return {
      title: [day, ' - ', approved, '% 👍 : ', disapproved, '% 👎'].join(''),
      day: day.replace(' ', '-').toLowerCase()
    };
  });
  console.log('Retrieved data: ', postData);

  await instance.exit();

  const postTitle = postData.title;
  const postFootNote = '点进来了解更多';

  const ALL_CONTENT = `${postTitle}\n${postFootNote}\n===\n${URL_TO_VISIT}`;
  console.log(ALL_CONTENT);

  await exec_sync(`curl -d "${ALL_CONTENT}" -H "Content-Type:text/plain" -X POST ${URL_TO_POST}`);
})();
