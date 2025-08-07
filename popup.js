let socket = null;

document.getElementById('submitBtn').addEventListener('click', async () => {
  const receiptInput = document.getElementById('receiptInput').value.trim();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['xlsx.full.min.js'],
  });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: async (receiptNumbers) => {
      let allData = '';

      // ⏰ Reload mỗi 1 tiếng
      setTimeout(() => {
        if (window.socket && window.socket.readyState === WebSocket.OPEN) {
          window.socket.send('doi_chut');
        } else {
          console.warn('⚠️ WebSocket chưa sẵn sàng, không gửi được doi_chut');
        }
        location.reload();
      }, 60 * 60 * 1000);

      try {
        console.log('Bat dau mo websocket', window.socket);
        if (!window.socket || window.socket.readyState === WebSocket.CLOSED) {
          window.socket = new WebSocket('ws://localhost:8082');

          window.socket.onopen = function () {
            console.log('WebSocket connected!');
          };

          window.socket.onmessage = async function (event) {
            const receiptNumber = event.data.trim();

            try {
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

              if (response.status === 403) {
                window.socket.send('doi_chut');
                location.reload();
                return;
              }

              const text = await response.text();
              window.socket.send(text);
            } catch (err) {
              console.error(
                'Error fetching data for receipt number:',
                receiptNumber,
                err
              );
            }
          };

          window.socket.onerror = function (error) {
            console.log('WebSocket Error:', error);
          };

          window.socket.onclose = function () {
            console.log('WebSocket connection closed');
          };
        } else {
          console.log('WebSocket already connected.');
        }

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

          const text = await response.text();
          //   allData += `\n\n--- Data for Receipt # ${receiptNumber} ---\n${text}`;
        }

        // Nếu bạn muốn lưu file thì có thể bật lại đoạn này:
        // const blobTxt = new Blob([allData], { type: 'text/plain;charset=utf-8' });
        // const linkTxt = document.createElement('a');
        // linkTxt.href = URL.createObjectURL(blobTxt);
        // linkTxt.download = `uscis_full_data.txt`;
        // linkTxt.click();
      } catch (err) {
        console.error('Fetch failed:', err.message);
      }
    },
    args: [
      receiptInput
        .split(',')
        .map((r) => r.trim())
        .filter(Boolean),
    ],
  });
});
