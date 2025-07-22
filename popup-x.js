console.log('ext');
document.getElementById('submitBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  console.log('file', file);

  if (!file) {
    alert('Please upload a CSV file!');
    return;
  }

  const reader = new FileReader();

  reader.onload = async function (event) {
    const data = event.target.result;

    // Convert CSV data to array of rows (using a simple CSV parser)
    const rows = data.split('\n').map((row) => row.split(','));

    let resultText = '';

    // Duyệt qua từng mã trong CSV và fetch status
    for (let i = 0; i < rows.length; i++) {
      const receiptNumber = rows[i][0].trim(); // Giả sử mã receipt ở cột đầu tiên

      if (!/^([A-Z]{3}\d{10})$/.test(receiptNumber)) {
        continue; // Bỏ qua nếu mã không hợp lệ
      }

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

        const text = await response.text();
        resultText += `Receipt: ${receiptNumber}\nStatus: ${text}\n\n`;
      } catch (err) {
        resultText += `Receipt: ${receiptNumber}\nStatus: Fetch failed\n\n`;
      }
    }

    // Tạo file TXT với kết quả
    const blob = new Blob([resultText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'uscis_status_results.txt';
    link.click();
  };

  // Đọc file CSV
  reader.readAsText(file);
});
