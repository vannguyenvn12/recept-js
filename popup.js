document.getElementById('submitBtn').addEventListener('click', async () => {
  const receiptInput = document.getElementById('receiptInput').value.trim();

  // Tách số biên nhận bằng dấu phẩy và loại bỏ các khoảng trắng thừa
  const receipts = receiptInput.split(',').map((receipt) => receipt.trim());

  // Kiểm tra từng số biên nhận
  const invalidReceipts = receipts.filter(
    (receipt) => !/^([A-Z]{3}\d{10})$/.test(receipt)
  );

  if (invalidReceipts.length > 0) {
    alert('Invalid Receipt Numbers: ' + invalidReceipts.join(', '));
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['xlsx.full.min.js'],
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [receipts],
    func: async (receiptNumbers) => {
      const flattenObject = (obj, prefix = '', res = {}) => {
        for (let key in obj) {
          const value = obj[key];
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof value === 'object' && value !== null) {
            flattenObject(value, newKey, res);
          } else {
            res[newKey] = value;
          }
        }
        return res;
      };

      let allData = ''; // Dữ liệu tổng hợp

      try {
        for (let receiptNumber of receiptNumbers) {
          const response = await fetch('https://egov.uscis.gov/', {
            headers: {
              accept: 'application/json',
              'accept-language': 'en-US,en;q=0.9',
              'content-type': 'text/plain;charset=UTF-8',
              'next-action': 'c37611844b50d0a4b2fe6b459b6d624a5a06ee8e',
              'next-router-state-tree':
                '%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22en%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%3F%7B%5C%22locale%5C%22%3A%5C%22en%5C%22%7D%22%2C%7B%7D%2C%22%2F%22%2C%22refresh%22%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D',
              priority: 'u=1, i',
              'sec-ch-ua':
                '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
              'sec-ch-ua-platform': '"Windows"',
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

          // Lấy phản hồi dưới dạng text
          const text = await response.text();

          // Thêm dữ liệu vào allData
          allData += `\n\n--- Data for Receipt # ${receiptNumber} ---\n${text}`;
        }

        // Tạo file TXT với tất cả dữ liệu tổng hợp
        const blobTxt = new Blob([allData], {
          type: 'text/plain;charset=utf-8',
        });

        const linkTxt = document.createElement('a');
        linkTxt.href = URL.createObjectURL(blobTxt);
        linkTxt.download = `uscis_full_data.txt`; // Tên tệp sẽ là uscsi_full_data.txt
        linkTxt.click();

        alert('✅ All USCIS data has been downloaded in a single TXT file!');
      } catch (err) {
        alert('❌ Fetch failed: ' + err.message);
      }
    },
  });
});
