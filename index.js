const puppeteer = require('puppeteer');
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
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const status = await page.goto(URL_TO_VISIT, {
    encoding: 'utf8',
    gzip: true
  });
  // console.log('Status: ', status);

  const chartData = await page.evaluate(() => {
    const chart = document.querySelector('div.chart').childNodes[0];
    const approved = chart.getElementsByClassName('label approve fg')[0].childNodes[0].textContent;
    const disapproved = chart.getElementsByClassName('label disapprove fg')[0].childNodes[0].textContent;
    const day = chart.getElementsByClassName('mouse-guide')[0].childNodes[0].textContent;

    return {
      title: [day, ' - ', approved, '% 👍 : ', disapproved, '% 👎'].join(''),
      day: day.replace(' ', '-').toLowerCase()
    };
  });
  console.log('Chart data: ', chartData);

  const pollData = await page.evaluate(() => {
    const polls = document.querySelectorAll('tr.new-poll:not(.hidden)');
    return polls;
  });
  console.log('Chart data: ', pollData);

  await browser.close();

  const postTitle = chartData.title;
  // const postFootNote = '点进来了解更多';
  // ${postFootNote}\n

  const ALL_CONTENT = `${postTitle}，点 ${URL_TO_VISIT} 了解更多 #Trump538#`;
  console.log(ALL_CONTENT);

  // await exec_sync(`curl -d "${ALL_CONTENT}" -H "Content-Type:text/plain" -X POST ${URL_TO_POST}`);
})();
