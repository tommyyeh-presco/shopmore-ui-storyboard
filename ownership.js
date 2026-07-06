(function () {
  // Ownership signalling across all pages. Consistent language everywhere:
  //   Platform surface = white + a partner-shop.tw browser URL bar
  //   SHOPMORE surface  = light blue (#DCE8EC)
  //   Payment           = white platform frame + platform URL + embedded
  //                       yellow SHOPMORE panel (an iframe inside the platform)

  var P = location.pathname;
  function is(n) { return P.indexOf(n) >= 0; }
  var PAGE =
    is('partner-storefront-reference') ? 'platform' :
    is('hosted-payment-and-consumer') ? 'payment' :
    (is('ops-console') || is('supplier-portal') || is('warehouse-apps') || is('partner-developer-sandbox')) ? 'shopmore' :
    'storyboard';

  // Retry helper: DC framework renders after our <head> script; keep applying
  // (idempotently) until `step` reports done or ~12s elapses.
  function persist(step) {
    var start = Date.now();
    (function tick() {
      var done = false;
      try { done = step(); } catch (e) {}
      if (done || Date.now() - start > 12000) return;
      setTimeout(tick, 120);
    })();
  }

  // Partner = Yahoo奇摩購物 (logo + tw.buy.yahoo.com address)
  var YH = { dom: 'tw.buy.yahoo.com', purple: '#6001D2' };
  function addr(path) { return YH.dom + (path ? '/' + path : ''); }
  function yahooize(scope) {
    if (!scope || scope.dataset.yhDone) return;
    var w = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null), nodes = [];
    while (w.nextNode()) nodes.push(w.currentNode);
    nodes.forEach(function (n) {
      var t = n.nodeValue;
      if (t.indexOf('partner-shop.tw') >= 0) t = t.split('partner-shop.tw').join(YH.dom);
      if (t.indexOf('合作平台購物網') >= 0) t = t.split('合作平台購物網').join('Yahoo!奇摩');
      if (t !== n.nodeValue) n.nodeValue = t;
    });
    [].forEach.call(scope.querySelectorAll('*'), function (n) {
      if (n.children.length === 0 && (n.textContent || '').trim() === '購' && !n.dataset.yh) {
        n.dataset.yh = '1'; n.textContent = 'Yahoo!';
        var s = n.style;
        s.background = YH.purple; s.width = 'auto'; s.height = 'auto';
        s.padding = '2px 6px'; s.fontStyle = 'italic'; s.fontSize = '10px';
        s.borderRadius = '5px'; s.letterSpacing = '-.3px';
      }
    });
    scope.dataset.yhDone = '1';
  }
  function platformHeader() {
    var h = document.createElement('div');
    h.className = 'sm-plat-head';
    h.innerHTML = '<span class="sm-yh">Yahoo!</span><span class="sm-plat-title">跨境結帳</span><span class="sm-zone">跨境專區</span>';
    return h;
  }

  function label(el) { return (el.getAttribute('data-screen-label') || '').trim(); }
  function isCard(el) { return label(el) !== 'MAIN FLOW' && el.getBoundingClientRect().width < 700; }
  function untagged() {
    return [].filter.call(document.querySelectorAll('[data-screen-label]'),
      function (c) { return !c.dataset.smTagged && isCard(c); });
  }
  function makeBar(addr) {
    var b = document.createElement('div');
    b.className = 'sm-urlbar'; b.textContent = '🔒 ' + addr; return b;
  }
  function tagPayment(c) {
    if (c.dataset.smTagged) return;
    c.classList.add('sm-own-payment');
    [].forEach.call(c.querySelectorAll('*'), function (n) {
      if (n.children.length === 0 && /pay\.shopmore\.hk/.test(n.textContent))
        n.textContent = '🔒 ' + addr('checkout');
    });
    var kids = [].slice.call(c.children), urlIdx = -1;
    kids.forEach(function (k, i) {
      if (urlIdx < 0 && (/partner-shop\.tw/.test(k.textContent) || RegExp(YH.dom).test(k.textContent)) && k.getBoundingClientRect().height < 44) urlIdx = i;
    });
    if (urlIdx < 0) {
      var start = (kids[0] && /5G|100%|:\d\d/.test(kids[0].textContent) && kids[0].getBoundingClientRect().height < 40) ? 1 : 0;
      c.insertBefore(makeBar(addr('checkout')), kids[start] || null);
      urlIdx = start;
    }
    // platform (Yahoo) checkout header sits above the embedded SHOPMORE payment
    c.insertBefore(platformHeader(), c.children[urlIdx + 1] || null);
    var embed = document.createElement('div'); embed.className = 'sm-embed';
    var cap = document.createElement('div'); cap.className = 'sm-embed-cap';
    cap.textContent = 'SHOPMORE 付款（嵌入 iframe）'; embed.appendChild(cap);
    [].slice.call(c.children).slice(urlIdx + 2).forEach(function (k) { embed.appendChild(k); });
    c.appendChild(embed);
    yahooize(c);
    c.dataset.smTagged = '1';
  }
  function legendItems() {
    return '<span class="sm-lg"><i class="sw" style="background:#fff;border:1px solid #D9D5C8"></i>Yahoo奇摩購物 (tw.buy.yahoo.com)</span>' +
           '<span class="sm-lg"><i class="sw" style="background:#DCE8EC"></i>SHOPMORE 系統</span>' +
           '<span class="sm-lg"><i class="sw" style="background:#FDF3D0;border:1px solid #E7B008"></i>SHOPMORE 付款（平台內嵌）</span>';
  }
  function banner(ownerHtml) {
    if (document.getElementById('sm-banner')) return true;
    var mf = [].find.call(document.querySelectorAll('[data-screen-label]'), function (n) { return label(n) === 'MAIN FLOW'; });
    var anchor = mf || document.querySelector('[data-screen-label]');
    if (!anchor || !anchor.parentNode) return false;
    var box = document.createElement('div');
    box.id = 'sm-banner'; box.className = 'sm-banner';
    box.innerHTML = '<span class="sm-owner">' + ownerHtml + '</span><span class="sm-legend-inline">' + legendItems() + '</span>';
    anchor.parentNode.insertBefore(box, anchor);
    return true;
  }

  function runStoryboard() {
    var PLATFORM_URL = {
      'S2 跨境購物車': addr('cart'), 'S3 結帳': addr('checkout'),
      'S4 訂單完成': addr('order/complete'), 'S11 訂單歷程': addr('orders/SM-2512-08841')
    };
    var HASURL = ['S1 平台首頁', 'S1 跨境專區首頁', 'S1 商品頁'];
    var SHOPMORE = ['S5 代購事件', 'S5 後台訂單', 'S9 關稅對帳', 'S11 後台結案', 'S6 入庫QC', 'S7 重包裝', 'S10 越庫事件'];
    function legend() {
      if (document.getElementById('sm-legend')) return;
      var root = document.querySelector('[data-flow-root]'); if (!root) return;
      var box = document.createElement('div');
      box.id = 'sm-legend'; box.setAttribute('data-stick-x', '1'); box.innerHTML = legendItems();
      root.insertBefore(box, root.children[3] || null);
    }
    persist(function () {
      document.querySelectorAll('[data-screen-label]').forEach(function (c) {
        if (c.dataset.smTagged) return;
        var L = label(c);
        if (SHOPMORE.indexOf(L) >= 0) c.classList.add('sm-own-shopmore');
        else if (L === 'S4 付款頁') { tagPayment(c); return; }
        else if (PLATFORM_URL[L]) { c.classList.add('sm-own-platform'); c.insertBefore(makeBar(PLATFORM_URL[L]), c.firstChild); yahooize(c); }
        else if (HASURL.indexOf(L) >= 0) { c.classList.add('sm-own-platform'); yahooize(c); }
        else return;
        c.dataset.smTagged = '1';
      });
      legend();
      return document.querySelector('.sm-own-shopmore') && document.querySelector('.sm-own-payment') &&
             document.querySelector('#sm-legend');
    });
  }

  function runPlatform() {
    document.documentElement.classList.add('sm-page-platform');
    var MAP = {
      'MF1 專區首頁': 'crossborder', 'MF2 商品頁': 'crossborder/item/8841', 'MF3 購物車': 'cart',
      'MF4 結帳': 'checkout', 'MF5 訂單完成': 'order/complete', 'MF8 EZWay横幅': 'orders/SM-2512-08841',
      'MF11 訂單詳情': 'orders/SM-2512-08841', 'B1 分類列表': 'crossborder/category', 'B2 搜尋結果': 'search?q=walkman',
      'B3 已售出': 'crossborder/item/8841', 'B4 價格更新': 'crossborder/item/8841', 'O1 訂單列表': 'orders',
      'O2 取消申請': 'orders/SM-2512-08841/cancel', 'O3 部分取消': 'orders/SM-2512-08841',
      'P1 退貨精靈': 'returns/new', 'P2 退貨進度': 'returns/status', 'P3 退款進度': 'refunds/status',
      'P4 客服表單': 'support/new', 'P5 案件對話': 'support/case', 'L1 條款頁': 'crossborder/terms'
    };
    persist(function () {
      untagged().forEach(function (c) {
        c.classList.add('sm-own-platform');
        c.insertBefore(makeBar(addr(MAP[label(c)] || '')), c.firstChild);
        yahooize(c);
        c.dataset.smTagged = '1';
      });
      var ok = banner('<i class="dot" style="background:#fff;border:1px solid #C9C4B4"></i>此頁：Yahoo奇摩購物 · tw.buy.yahoo.com');
      return ok && untagged().length === 0 && document.querySelector('.sm-urlbar');
    });
  }

  function runShopmore() {
    document.documentElement.classList.add('sm-page-shopmore');
    persist(function () {
      return banner('<i class="dot" style="background:#DCE8EC"></i>此頁：SHOPMORE 內部系統');
    });
  }

  function runPayment() {
    document.documentElement.classList.add('sm-page-shopmore');
    var PAY = ['MF4a 付款頁', 'MF4b 處理中', 'MF4c 成功返回', 'E1 付款失敗', 'E2 逾時', 'E3 重複交易'];
    persist(function () {
      untagged().forEach(function (c) {
        if (PAY.indexOf(label(c)) >= 0) tagPayment(c);
        else c.dataset.smTagged = 'skip';
      });
      var ok = banner('<i class="dot" style="background:#DCE8EC"></i>此頁：SHOPMORE 消費者頁面（付款為平台內嵌）');
      return ok && untagged().length === 0 && document.querySelector('.sm-own-payment');
    });
  }

  ({ storyboard: runStoryboard, platform: runPlatform, shopmore: runShopmore, payment: runPayment })[PAGE]();
})();
