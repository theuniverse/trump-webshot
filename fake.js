const webshot = require('webshot');
const phantom = require('phantom');
const exec = require('child_process').exec;

const URL_TO_VISIT = 'https://projects.fivethirtyeight.com/trump-approval-ratings/';

async function sleep(timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(function() {
      resolve();
    }, timeout);
  });
}

(async function() {
  console.log('Start retrieving ' + URL_TO_VISIT);
  const instance = await phantom.create();
  const page = await instance.createPage();
  const status = await page.open(URL_TO_VISIT, {
    encoding: 'utf8',
    gzip: true
  });
  console.log('Status: ' + status);

  const postData = await page.evaluate(function() {
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
}());
