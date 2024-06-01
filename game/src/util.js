import mitt from 'mitt'

function throttle(fn, delay = 500) {
  let timer = null;

  // throttle 本身會回傳一個函式，透過 ...args 拿到該函式的引數
  return function (...args) {
    // 如果有計時器，表示還在 delay 的秒數內
    // 直接 return，不往下執行程式碼
    if (timer) return;

    // 如果計時器不等於 null，會進到以下邏輯

    // 設定計時器，在 delay 秒數之後，將計時器值為改為 null
    // 如果還不到 delay 的秒數，再執行一次的話
    // 因為 timer 的值不為 null，前面就先 return 不會進到這段邏輯
    // 可以達到 throttle 的目的，將一段時間內的操作，集合成一次執行
    timer = setTimeout(() => {
      timer = null;
    }, delay);

    // 直到時間到了後，timer 變成 null，才能夠執行函式
    // 用 .apply 來呼叫，才能
    fn.apply(this, args);
  };
}

export { throttle }


const getRole = (role) => {
  switch (role) {
    case 0: return "平民"
    case 1: return "臥底"
    case 2: return "白板"
  }
}


const getRoleClass = (role) => {
  switch (role) {
    case 0: return "loyal"
    case 1: return "spy"
    case 2: return "white"
  }
}
export { getRole, getRoleClass }

const emitter = mitt()

export {emitter}