const webshot = require('webshot');
const phantom = require('phantom');

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

capture('div.chart.main', 'trend.png');
capture('div.polls', 'polls.png');

(async function() {
  const instance = await phantom.create();
  const page = await instance.createPage();
  const status = await page.open(URL_TO_VISIT);
  console.log(status);

  const innerHTML = await page.evaluate(function() {
    const chart = document.querySelector('div.chart');
    const approved = chart.childNodes[0].getElementsByClassName('label approve fg')[0].childNodes[0].textContent;
    const disapproved = chart.childNodes[0].getElementsByClassName('label disapprove fg')[0].childNodes[0].textContent;
    const day = chart.childNodes[0].getElementsByClassName('mouse-guide')[0].childNodes[0].textContent;
    return [day, ': ', approved, ' (Approved) - ', disapproved, ' (Disapproved).'].join('');
  });

  await instance.exit();
}());
