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

function capture(selector, name) {
  webshot(
    URL_TO_VISIT,
    name,
    {
      captureSelector: selector,
      width: 1024,
      height: 550
    },
    function(err) {
      console.log(name + ' captured');
    }
  );
}

(async function() {
  console.log('Start retrieving ' + URL_TO_VISIT);
  const instance = await phantom.create();
  const page = await instance.createPage();
  await page.on('onResourceRequested', function(requestData) {
    console.info('Requesting', requestData.url);
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
      title: [day, ': ', approved, ' (👍) - ', disapproved, ' (👎)'].join(''),
      day: day.replace(' ', '-').toLowerCase()
    };
  });

  console.log('Retrieved data: ', postData);

  await instance.exit();

  const postTitle = postData.title;
  const postDay = postData.day;
  const postUrl = postTitle.replace(/[^a-zA-Z0-9\uD83D\uDC4D\uD83D\uDC4E]+/g, '-').replace(/-$/g, '');

  capture('div.chart.main', 'trend-' + postDay + '.png');
  capture('div.polls', 'polls-' + postDay + '.png');

  exec('cd blog && hexo new "' + postTitle + '"', (error, stdout, stderr) => {
    if(error) {
      console.log(error);
      return;
    }

    exec('cp *.png blog/source/images/ && echo "![Trend](/images/trend.png)\n\n![Polls](/images/polls.png)" >> "blog/source/_posts/' + postUrl + '.md"', (error, stdout, stderr) => {
      if(error) {
        console.log(error);
        return;
      }
    });
  });
}());
