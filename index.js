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

async function capture(selector, name) {
  return new Promise((resolve, reject) => {
    webshot(
      URL_TO_VISIT,
      name,
      {
        captureSelector: selector,
        width: 1024,
        height: 550
      },
      function(err) {
        if (err) {
          console.log(err);
          reject();
        } else {
          console.log(name + ' captured');
          resolve();
        }
      }
    );
  });
}

async function exec_sync(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.log(error);
        reject();
      }

      resolve();
    });
  });
}

(async function() {
  console.log('Start retrieving ' + URL_TO_VISIT);
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on('onResourceRequested', function(requestData) {
    // console.info('Requesting', requestData.url);
  });

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

  const postTitle = postData.title;
  const postDay = postData.day;
  const postUrl = postTitle.replace(/[^a-zA-Z0-9\uD83D\uDC4D\uD83D\uDC4E]+/g, '-').replace(/-$/g, '');

  const trendPic = 'trend-' + postDay + '.png';
  const pollsPic = 'polls-' + postDay + '.png';

  await capture('div.chart.main', trendPic);
  await capture('div.polls', pollsPic);

  const TREND_POLLS_LINE = '![Trend](/images/' + trendPic + ')\n\n![Polls](/images/' + pollsPic + ')\n\n';
  const FOOT_NOTE = 'More to visit ***[How (un)popular is Donald Trump?](https://projects.fivethirtyeight.com/trump-approval-ratings/)*** on FiveThirtyEight';
  const ALL_CONTENT = TREND_POLLS_LINE + FOOT_NOTE;

  await exec_sync('cd blog && hexo new "' + postTitle + '"');
  await exec_sync('mv *.png blog/source/images/');
  await exec_sync('echo "' + ALL_CONTENT + '" >> "blog/source/_posts/' + postUrl + '.md"');
}());
