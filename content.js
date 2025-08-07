const reloadAfterMs = 60 * 60 * 1000; // 1 giờ
const startTime = Date.now();

const reloadTimer = setInterval(() => {
  const elapsed = Date.now() - startTime;
  if (elapsed >= reloadAfterMs) {
    console.log('⏰ Đã đến 1 tiếng — thực hiện reload...');
    if (
      typeof window.socket !== 'undefined' &&
      window.socket.readyState === WebSocket.OPEN
    ) {
      window.socket.send('doi_chut');
    }
    location.reload();
    clearInterval(reloadTimer);
  }
}, 10 * 1000); // kiểm tra mỗi 10s
