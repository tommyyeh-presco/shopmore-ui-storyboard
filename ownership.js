(function () {
  // Ownership tagging for the storyboard: make it unmistakable whose surface
  // each screen is. Platform = white + partner-shop.tw URL bar. SHOPMORE =
  // light blue. Payment = white platform frame + platform URL + embedded
  // yellow SHOPMORE panel (it is an iframe inside the platform page).

  var PLATFORM_URL = {                       // platform screens missing a URL bar
    'S2 跨境購物車': 'partner-shop.tw/cart',
    'S3 結帳': 'partner-shop.tw/checkout',
    'S4 訂單完成': 'partner-shop.tw/order/complete',
    'S11 訂單歷程': 'partner-shop.tw/orders/SM-2512-08841'
  };
  var PLATFORM_HASURL = ['S1 平台首頁', 'S1 跨境專區首頁', 'S1 商品頁']; // already show partner-shop.tw
  var SHOPMORE = ['S5 代購事件', 'S5 後台訂單', 'S9 關稅對帳', 'S11 後台結案',
                  'S6 入庫QC', 'S7 重包裝', 'S10 越庫事件'];
  var PAYMENT = 'S4 付款頁';

  function makeBar(addr) {
    var b = document.createElement('div');
    b.className = 'sm-urlbar';
    b.textContent = '🔒 ' + addr;
    return b;
  }

  function tagPayment(c) {
    c.classList.add('sm-own-payment');
    // rewrite the SHOPMORE payment domain to the platform URL (it is embedded)
    var kids = [].slice.call(c.children);
    var urlIdx = -1;
    [].forEach.call(c.querySelectorAll('*'), function (n) {
      if (n.children.length === 0 && /pay\.shopmore\.hk/.test(n.textContent)) {
        n.textContent = '🔒 partner-shop.tw/crossborder/pay';
      }
    });
    kids.forEach(function (k, i) {
      if (urlIdx < 0 && /partner-shop\.tw/.test(k.textContent) &&
          k.getBoundingClientRect().height < 44) urlIdx = i;
    });
    if (urlIdx < 0) urlIdx = 0;
    var embed = document.createElement('div');
    embed.className = 'sm-embed';
    var cap = document.createElement('div');
    cap.className = 'sm-embed-cap';
    cap.textContent = 'SHOPMORE 付款（嵌入 iframe）';
    embed.appendChild(cap);
    kids.slice(urlIdx + 1).forEach(function (k) { embed.appendChild(k); });
    c.appendChild(embed);
  }

  function apply() {
    var n = 0;
    document.querySelectorAll('[data-screen-label]').forEach(function (c) {
      if (c.dataset.smTagged) return;
      var L = (c.getAttribute('data-screen-label') || '').trim();
      if (SHOPMORE.indexOf(L) >= 0) { c.classList.add('sm-own-shopmore'); }
      else if (L === PAYMENT) { tagPayment(c); }
      else if (PLATFORM_URL[L]) { c.classList.add('sm-own-platform'); c.insertBefore(makeBar(PLATFORM_URL[L]), c.firstChild); }
      else if (PLATFORM_HASURL.indexOf(L) >= 0) { c.classList.add('sm-own-platform'); }
      else return;                            // neutral (consumer device / customs)
      c.dataset.smTagged = '1'; n++;
    });
    return n;
  }

  function legend() {
    if (document.getElementById('sm-legend')) return;
    var root = document.querySelector('[data-flow-root]');
    if (!root) return;
    var box = document.createElement('div');
    box.id = 'sm-legend';
    box.setAttribute('data-stick-x', '1');
    box.innerHTML =
      '<span class="sm-lg"><i class="sw" style="background:#fff;border:1px solid #D9D5C8"></i>平台網站 (partner-shop.tw)</span>' +
      '<span class="sm-lg"><i class="sw" style="background:#DCE8EC"></i>SHOPMORE 系統</span>' +
      '<span class="sm-lg"><i class="sw" style="background:#FDF3D0;border:1px solid #E7B008"></i>SHOPMORE 付款（平台內嵌）</span>';
    root.insertBefore(box, root.children[3] || null);
  }

  var tries = 0;
  (function loop() {
    var found = apply();
    legend();
    if (tries++ > 60) return;
    if (found > 0 && document.querySelector('.sm-own-shopmore') &&
        document.querySelector('.sm-own-payment')) return; // stable
    requestAnimationFrame(loop);
  })();
})();
