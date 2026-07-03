(function () {
  var OK = "60ddb4aaa0f26a6f00fa26bf265e701481f003db3a37a9c711fc0a6e683bb3cc";
  var KEY = "sm_sb_gate_v1";
  try { if (localStorage.getItem(KEY) === OK) return; } catch (e) {}

  var root = document.documentElement;
  root.style.visibility = "hidden";

  function sha256Hex(text) {
    if (window.crypto && crypto.subtle && window.isSecureContext) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ("0" + b.toString(16)).slice(-2);
        }).join("");
      });
    }
    return Promise.reject(new Error("no-subtle"));
  }

  function show() {
    var ov = document.createElement("div");
    ov.id = "sm-gate";
    ov.style.cssText = "position:fixed;inset:0;z-index:2147483647;background:#F4F3EE;display:flex;align-items:center;justify-content:center;font-family:'Noto Sans TC','PingFang TC',-apple-system,sans-serif;visibility:visible";
    ov.innerHTML =
      '<div style="background:#fff;border:1px solid #E2DFD4;border-radius:16px;padding:36px 40px;width:320px;box-shadow:0 8px 30px rgba(32,33,36,.12);text-align:center">' +
      '<div style="font-size:12px;font-weight:700;letter-spacing:2px;color:#0F6E84;font-family:ui-monospace,monospace">SHOPMORE</div>' +
      '<div style="font-size:18px;font-weight:900;color:#22242A;margin:6px 0 18px">跨境 UI Storyboard</div>' +
      '<input id="sm-gate-pw" type="password" placeholder="密碼 Password" autocomplete="off" style="width:100%;box-sizing:border-box;border:1px solid #DDD9CE;border-radius:8px;padding:10px 12px;font-size:14px;outline-color:#0F6E84">' +
      '<div id="sm-gate-err" style="height:18px;font-size:12px;color:#B3261E;margin-top:6px"></div>' +
      '<button id="sm-gate-go" style="width:100%;background:#0F6E84;color:#fff;border:0;border-radius:8px;padding:10px 0;font-size:14px;font-weight:700;cursor:pointer">進入 Enter</button>' +
      "</div>";

    function mount() {
      document.body.appendChild(ov);
      root.style.visibility = "visible";
      var pw = document.getElementById("sm-gate-pw");
      var err = document.getElementById("sm-gate-err");
      function attempt() {
        var v = pw.value || "";
        sha256Hex(v).then(function (hex) {
          if (hex === OK) {
            try { localStorage.setItem(KEY, OK); } catch (e) {}
            ov.remove();
          } else {
            err.textContent = "密碼錯誤 Incorrect password";
            pw.value = "";
            pw.focus();
          }
        }).catch(function () {
          err.textContent = "請使用 https 連線 Use https";
        });
      }
      document.getElementById("sm-gate-go").addEventListener("click", attempt);
      pw.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
      pw.focus();
    }

    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount);
  }

  show();
})();
