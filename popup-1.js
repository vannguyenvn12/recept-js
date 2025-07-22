document.getElementById('submitBtn').addEventListener('click', async () => {
  const receipt = document.getElementById('receiptInput').value.trim();

  if (!/^([A-Z]{3}\d{10})$/.test(receipt)) {
    alert('Invalid Receipt Number!');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Inject SheetJS trước
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['xlsx.full.min.js'],
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [receipt],
    func: async (receiptNumber) => {
      try {
        const response = await fetch('https://egov.uscis.gov/', {
          headers: {
            accept: 'application/json', // quan trọng
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'text/plain;charset=UTF-8',
            'next-action': 'c37611844b50d0a4b2fe6b459b6d624a5a06ee8e',
            'next-router-state-tree':
              '%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%3F%7B%5C%22locale%5C%22%3A%5C%22en%5C%22%7D%22%2C%7B%7D%2C%22%2F%22%2C%22refresh%22%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
            priority: 'u=1, i',
            'sec-ch-ua':
              '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
            'sec-ch-ua-arch': '"x86"',
            'sec-ch-ua-bitness': '"64"',
            'sec-ch-ua-full-version': '"138.0.7204.101"',
            'sec-ch-ua-full-version-list':
              '"Not)A;Brand";v="8.0.0.0", "Chromium";v="138.0.7204.101", "Google Chrome";v="138.0.7204.101"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-model': '""',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua-platform-version': '"15.0.0"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
          },
          referrer: 'https://egov.uscis.gov/',
          body: JSON.stringify([receiptNumber]),
          method: 'POST',
          mode: 'cors',
          credentials: 'include',
        });

        const json = await response.json();

        const details = json?.data?.CaseStatusResponse?.detailsEng || {};

        const desc = details.actionCodeDesc || 'No description';
        const status = details.actionCodeText || 'No status';

        const data = [
          ['Receipt Number', receiptNumber],
          ['Status', status],
          ['Description', desc],
          ['Checked At', new Date().toLocaleString()],
        ];

        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'USCIS Result');

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], {
          type: 'application/octet-stream',
        });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `uscis_${receiptNumber}.xlsx`;
        link.click();

        alert('✅ File USCIS status đã được tải xuống!');
      } catch (err) {
        alert('❌ Fetch failed: ' + err.message);
      }
    },
  });
});
