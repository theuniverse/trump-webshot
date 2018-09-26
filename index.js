const puppeteer = require('puppeteer');
const exec = require('child_process').exec;

const URL_TO_VISIT = 'https://projects.fivethirtyeight.com/trump-approval-ratings/';
// const URL_TO_POST = 'https://ifttj.wong2.me/Sk09tE7hM';

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
    const dayStr = chart.getElementsByClassName('mouse-guide')[0].childNodes[0].textContent;
    const day = dayStr.replace('DAY ', '');

    return {
      title: ['第 ', day, ' 天 - 👍 ', approved, '%: 👎 ', disapproved, '%'].join(''),
      day: day.replace(' ', '-').toLowerCase()
    };
  });
  console.log('Chart data: ', chartData);

  const pollRawData = await page.evaluate(() => {
    const result = [];
    const polls = document.querySelectorAll('div.polls tr.new-poll');
    if (polls) {
      polls.forEach(poll => {
        if (poll.classList.contains('hidden')) {
          return;
        }

        const date = poll.querySelector('td.dates div.short').textContent;
        const pollster = poll.querySelector('td.pollster a').textContent;
        const src = poll.querySelector('td.pollster a').getAttribute('href');
        const grade = poll.querySelector('td.grade div.gradeText').textContent;
        const sample = poll.querySelector('td.sample').textContent;
        const sampleType = poll.querySelector('td.sample-type').textContent;
        const weight = poll.querySelector('td.weight div.weight-text').textContent;
        const approved = poll.querySelector('td.answer.first div.heat-map').textContent;
        const rejected = poll.querySelector('td.answer.last div.heat-map').textContent;
        const approvedAdjusted = poll.querySelector('td.answer.adjusted.first div.heat-map').textContent;
        const rejectedAdjusted = poll.querySelector('td.answer.adjusted.last div.heat-map').textContent;
        result.push({ date, pollster, src, grade, sample, sampleType, weight, approved, approvedAdjusted, rejected, rejectedAdjusted });
      });
    }
    return result;
  });
  const pollData = pollRawData.map(poll => `${poll.pollster}, ${poll.date}\n等级：${poll.grade}，权重：${poll.weight}，样本：${poll.sample}(${poll.sampleType})\n调整前 👍 ${poll.approved} : 👎 ${poll.rejected}\n调整后 👍 ${poll.approvedAdjusted} : 👎 ${poll.rejectedAdjusted}`);
  // console.log('Poll data:\n', pollData.join(';\n\n'));

  await browser.close();

  const postTitle = chartData.title;
  // const postFootNote = '点进来了解更多';
  // ${postFootNote}\n

  const ALL_CONTENT = `${postTitle}\n\n最近民调：\n\n${pollData.join(';\n\n')}\n\n更多信息点击 ${URL_TO_VISIT} 了解。 #Trump538#`;
  console.log(ALL_CONTENT);

  // await exec_sync(`curl -d "${ALL_CONTENT}" -H "Content-Type:text/plain" -X POST ${URL_TO_POST}`);
})();
