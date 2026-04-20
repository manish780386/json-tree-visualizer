import * as vscode from 'vscode';

let panel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {

  context.subscriptions.push(
    vscode.commands.registerCommand('jsonVisualizer.openPanel', () => {
      openOrRevealPanel(context);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jsonVisualizer.visualizeSelection', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) { return; }
      const selected = editor.document.getText(editor.selection);
      if (!selected.trim()) {
        vscode.window.showWarningMessage('Select JSON text first!');
        return;
      }
      openOrRevealPanel(context);
      setTimeout(() => {
        panel?.webview.postMessage({ type: 'loadJson', data: selected });
      }, 600);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('jsonVisualizer.fetchApi', async () => {
      const url = await vscode.window.showInputBox({
        prompt: 'Enter API URL (GET request)',
        placeHolder: 'https://jsonplaceholder.typicode.com/users'
      });
      if (!url) { return; }
      openOrRevealPanel(context);
      setTimeout(() => {
        panel?.webview.postMessage({ type: 'fetchUrl', url });
      }, 600);
    })
  );
}

function openOrRevealPanel(context: vscode.ExtensionContext) {
  if (panel) {
    panel.reveal(vscode.ViewColumn.Beside);
    return;
  }

  panel = vscode.window.createWebviewPanel(
    'jsonVisualizer',
    '🌳 JSON Visualizer Pro',
    vscode.ViewColumn.Beside,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  panel.webview.html = getWebviewContent();

  panel.webview.onDidReceiveMessage(
    async (message: { type: string; text?: string }) => {
      if (message.type === 'copyToClipboard' && message.text) {
        await vscode.env.clipboard.writeText(message.text);
        vscode.window.showInformationMessage('Copied to clipboard!');
      } else if (message.type === 'error' && message.text) {
        vscode.window.showErrorMessage(message.text);
      } else if (message.type === 'info' && message.text) {
        vscode.window.showInformationMessage(message.text);
      }
    },
    undefined,
    context.subscriptions
  );

  panel.onDidDispose(() => { panel = undefined; });
}

function getWebviewContent(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>JSON Visualizer Pro</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap');
:root {
  --bg:#0d1117;--surface:#161b22;--surface2:#1c2128;--surface3:#21262d;
  --border:#30363d;--accent:#58a6ff;--accent-h:#79c0ff;
  --green:#3fb950;--red:#f78166;--orange:#ffa657;--purple:#d2a8ff;--yellow:#e3b341;
  --text:#e6edf3;--muted:#7d8590;--subtle:#484f58;
  --str:#a5d6ff;--num:#ffa657;--bool:#ff7b72;--null:#8b949e;--key:#79c0ff;
  --d0:#58a6ff;--d1:#3fb950;--d2:#ffa657;--d3:#d2a8ff;--d4:#ff7b72;--d5:#e3b341;
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',sans-serif;background:var(--bg);color:var(--text);height:100vh;display:flex;flex-direction:column;overflow:hidden;font-size:13px}
::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}

/* HEADER */
.hdr{display:flex;align-items:center;gap:10px;padding:8px 14px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap}
.logo{font-size:13px;font-weight:700;color:var(--accent)}
.logo-badge{background:linear-gradient(135deg,var(--accent),var(--purple));color:#000;font-size:9px;font-weight:800;padding:2px 6px;border-radius:4px;margin-left:6px;letter-spacing:.5px}
.hdr-actions{display:flex;gap:5px;margin-left:auto;flex-wrap:wrap}

/* BUTTON */
.btn{background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:'Inter',sans-serif;font-size:11px;font-weight:500;padding:4px 10px;border-radius:5px;cursor:pointer;transition:all .15s;white-space:nowrap;display:flex;align-items:center;gap:4px}
.btn:hover{border-color:var(--accent);color:var(--accent);background:rgba(88,166,255,.06)}
.btn.pri{background:var(--accent);color:#000;border-color:var(--accent);font-weight:600}.btn.pri:hover{background:var(--accent-h)}
.btn.suc{background:var(--green);color:#000;border-color:var(--green);font-weight:600}
.btn.dan{border-color:var(--red);color:var(--red)}.btn.dan:hover{background:var(--red);color:#000}
.btn.war{border-color:var(--orange);color:var(--orange)}.btn.war:hover{background:var(--orange);color:#000}
.btn.pur{border-color:var(--purple);color:var(--purple)}.btn.pur:hover{background:var(--purple);color:#000}

/* NAV */
.nav{display:flex;background:var(--surface);border-bottom:1px solid var(--border);padding:0 14px;gap:2px;flex-shrink:0;overflow-x:auto}
.nav-tab{padding:7px 13px;font-size:12px;font-weight:500;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap;user-select:none}
.nav-tab.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600}
.nav-tab:hover:not(.active){color:var(--text)}

/* WORKSPACE */
.ws{display:flex;flex:1;overflow:hidden}
.page{display:none;flex:1;overflow:hidden}
.page.active{display:flex}

/* SIDEBAR */
.sidebar{width:280px;flex-shrink:0;border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--surface)}
.sec-lbl{padding:7px 12px;font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.8px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px}
.dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
textarea.jin{width:100%;background:transparent;border:none;outline:none;resize:none;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.6;padding:10px 12px;height:175px;flex-shrink:0}
textarea.jin::placeholder{color:var(--subtle)}
.sb-acts{padding:8px 12px;display:flex;gap:6px;flex-wrap:wrap;border-bottom:1px solid var(--border)}
.api-sec{padding:8px 12px;display:flex;flex-direction:column;gap:6px;border-bottom:1px solid var(--border)}
.api-row{display:flex;gap:5px}
.meth{background:var(--surface3);border:1px solid var(--border);color:var(--orange);font-family:'JetBrains Mono',monospace;font-size:10px;font-weight:700;padding:4px 6px;border-radius:5px;outline:none;cursor:pointer;width:70px}
.ipt{flex:1;background:var(--surface3);border:1px solid var(--border);border-radius:5px;padding:5px 8px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:11px;outline:none;width:100%}
.ipt:focus{border-color:var(--accent)}.ipt::placeholder{color:var(--subtle)}
.body-ta{height:55px;resize:none}
.auth-sel{background:var(--surface3);border:1px solid var(--border);color:var(--text);font-family:'Inter',sans-serif;font-size:11px;padding:4px 6px;border-radius:5px;outline:none;width:90px}

/* MAIN */
.main{flex:1;display:flex;flex-direction:column;overflow:hidden}
.toolbar{display:flex;align-items:center;gap:8px;padding:7px 14px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0;flex-wrap:wrap}
.srch-wrap{display:flex;align-items:center;gap:6px;flex:1;min-width:140px}
.srch{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:4px 10px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:11.5px;outline:none}
.srch:focus{border-color:var(--accent)}.srch::placeholder{color:var(--muted)}
.mc{font-size:10px;color:var(--muted);white-space:nowrap}
.vtoggles{display:flex;gap:3px}
.vbtn{background:var(--surface2);border:1px solid var(--border);color:var(--muted);font-size:11px;padding:3px 8px;border-radius:4px;cursor:pointer;transition:all .15s}
.vbtn.active{background:var(--accent);color:#000;border-color:var(--accent);font-weight:600}

/* CONTENT */
.ctabs{display:flex;flex:1;overflow:hidden}
.ctab{display:none;flex:1;overflow:hidden;flex-direction:column}
.ctab.active{display:flex}

/* TREE */
.tree-sc{flex:1;overflow:auto;padding:12px 14px;font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.75}
.tree-node{}
.tree-row{display:flex;align-items:center;gap:3px;padding:1px 2px;border-radius:4px;cursor:pointer;transition:background .1s}
.tree-row:hover{background:rgba(88,166,255,.07)}
.tree-row.smatch{background:rgba(255,166,87,.12)!important;outline:1px solid rgba(255,166,87,.3)}
.tree-row.edited{background:rgba(63,185,80,.08)!important}
.tog{width:14px;height:18px;display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--muted);flex-shrink:0;transition:transform .15s;user-select:none}
.tog.open{transform:rotate(90deg)}.tog.sp{opacity:0;pointer-events:none}
.nkey{font-weight:600}
.ncol{color:var(--muted);margin:0 4px}
.tpill{font-size:8.5px;font-weight:700;padding:1px 5px;border-radius:3px;margin-left:5px;opacity:.75;letter-spacing:.4px;font-family:'Inter',sans-serif}
.po{background:rgba(88,166,255,.15);color:var(--accent)}.pa{background:rgba(210,168,255,.15);color:var(--purple)}
.ps{background:rgba(165,214,255,.1);color:var(--str)}.pn{background:rgba(255,166,87,.1);color:var(--num)}
.pb{background:rgba(255,123,114,.1);color:var(--bool)}.pnu{background:rgba(139,148,158,.1);color:var(--null)}
.cchip{font-size:9px;color:var(--muted);background:var(--surface3);border:1px solid var(--border);border-radius:8px;padding:0 6px;margin-left:4px;font-family:'Inter',sans-serif}
.vs{color:var(--str)}.vn{color:var(--num)}.vb{color:var(--bool)}.vnu{color:var(--null);font-style:italic}
.kids{margin-left:18px;border-left:1px solid var(--border);padding-left:8px}
.kids.col{display:none}
.d0 .nkey{color:var(--d0)}.d1 .nkey{color:var(--d1)}.d2 .nkey{color:var(--d2)}
.d3 .nkey{color:var(--d3)}.d4 .nkey{color:var(--d4)}.d5 .nkey{color:var(--d5)}
.racts{display:none;gap:4px;margin-left:auto;flex-shrink:0}
.tree-row:hover .racts{display:flex}
.rab{background:var(--surface2);border:1px solid var(--border);color:var(--muted);font-size:10px;padding:1px 5px;border-radius:3px;cursor:pointer;transition:all .1s}
.rab:hover{color:var(--accent);border-color:var(--accent)}
.edit-in{background:var(--surface3);border:1px solid var(--accent);border-radius:3px;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:12px;padding:1px 5px;outline:none;min-width:80px;max-width:300px}

/* GRAPH */
.graph-wrap{flex:1;overflow:hidden;position:relative;cursor:grab}
.graph-wrap:active{cursor:grabbing}
#graphCanvas{width:100%;height:100%;display:block}
.graph-hint{position:absolute;bottom:10px;right:14px;font-size:10px;color:var(--muted);background:var(--surface);border:1px solid var(--border);padding:4px 8px;border-radius:4px}

/* CODE PANELS */
.cpanel{flex:1;overflow:auto;padding:14px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.7;white-space:pre-wrap;word-break:break-all}
.ptoolbar{padding:7px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;gap:6px;flex-shrink:0}

/* DIFF */
.diff-layout{display:flex;flex:0 0 220px;border-bottom:1px solid var(--border)}
.diff-pane{flex:1;display:flex;flex-direction:column;overflow:hidden;border-right:1px solid var(--border)}
.diff-pane:last-child{border-right:none}
.diff-hdr{padding:7px 12px;font-size:11px;font-weight:600;color:var(--muted);border-bottom:1px solid var(--border);background:var(--surface)}
.diff-pane textarea{flex:1;background:transparent;border:none;outline:none;resize:none;color:var(--text);font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.6;padding:10px 12px}
.diff-res{flex:1;overflow:auto;padding:12px;font-family:'JetBrains Mono',monospace;font-size:11.5px;line-height:1.8}
.da{color:var(--green);background:rgba(63,185,80,.08);display:block;padding:0 4px;border-radius:2px}
.dr{color:var(--red);background:rgba(247,129,102,.08);display:block;padding:0 4px;border-radius:2px;text-decoration:line-through}
.dk{color:var(--accent);font-weight:600}

/* JSONPATH */
.jp-bar{padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;gap:8px;align-items:center}
.jp-in{flex:1;background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:6px 12px;color:var(--accent);font-family:'JetBrains Mono',monospace;font-size:13px;outline:none}
.jp-in:focus{border-color:var(--accent)}
.jp-res{flex:1;overflow:auto;padding:14px;font-family:'JetBrains Mono',monospace;font-size:12px;line-height:1.7}
.jp-match{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:8px 12px;margin-bottom:8px;border-left:3px solid var(--accent)}
.jp-path{font-size:10px;color:var(--muted);margin-bottom:4px}

/* SCROLL LIST */
.slist{overflow-y:auto;flex:1}
.li{padding:7px 12px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .1s;display:flex;align-items:center;justify-content:space-between;gap:8px}
.li:hover{background:rgba(88,166,255,.06)}
.li-lbl{font-size:11px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.li-meta{font-size:10px;color:var(--muted);white-space:nowrap}
.li-del{color:var(--subtle);cursor:pointer;font-size:12px;flex-shrink:0}.li-del:hover{color:var(--red)}
.elist{padding:16px 12px;font-size:11px;color:var(--muted);text-align:center}

/* STATS */
.stats{display:flex;gap:16px;padding:5px 14px;background:var(--surface);border-top:1px solid var(--border);font-size:10.5px;color:var(--muted);flex-shrink:0;flex-wrap:wrap}
.sv{color:var(--accent);font-weight:600}

/* EMPTY / ERROR / LOADING */
.empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:var(--muted);text-align:center;padding:20px}
.eico{font-size:40px;opacity:.4}
.etit{font-size:15px;font-weight:700;color:var(--text)}
.esub{font-size:12px;line-height:1.6;max-width:280px}
.kbadge{background:var(--surface2);border:1px solid var(--border);border-radius:5px;padding:5px 12px;font-size:11px;font-family:'JetBrains Mono',monospace;color:var(--accent);margin-top:6px}
.errbox{margin:14px;padding:10px 14px;background:rgba(247,129,102,.08);border:1px solid rgba(247,129,102,.25);border-radius:6px;color:var(--red);font-size:12px;font-family:'JetBrains Mono',monospace;white-space:pre-wrap}
.loading{display:flex;align-items:center;gap:8px;padding:20px;color:var(--accent);font-size:13px}
.spin{width:14px;height:14px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;bottom:30px;right:20px;background:var(--green);color:#000;font-size:12px;font-weight:600;padding:7px 14px;border-radius:6px;transform:translateY(60px);opacity:0;transition:all .25s;z-index:9999}
.toast.show{transform:translateY(0);opacity:1}
</style>
</head>
<body>

<div class="hdr">
  <span class="logo">🌳 JSON Visualizer<span class="logo-badge">PRO</span></span>
  <div class="hdr-actions">
    <button class="btn" onclick="expandAll()">⊞ Expand</button>
    <button class="btn" onclick="collapseAll()">⊟ Collapse</button>
    <button class="btn war" onclick="bookmarkCurrent()">★ Bookmark</button>
    <button class="btn pur" onclick="exportModified()">↓ Export JSON</button>
    <button class="btn" onclick="copyFormatted()">⎘ Copy</button>
    <button class="btn dan" onclick="clearAll()">✕ Clear</button>
  </div>
</div>

<div class="nav">
  <div class="nav-tab active" onclick="switchNav('vis',this)">🌳 Visualizer</div>
  <div class="nav-tab" onclick="switchNav('diff',this)">⚡ JSON Diff</div>
  <div class="nav-tab" onclick="switchNav('jp',this)">🔍 JSONPath</div>
  <div class="nav-tab" onclick="switchNav('conv',this)">🔄 Convert</div>
  <div class="nav-tab" onclick="switchNav('hist',this)">🕐 History</div>
  <div class="nav-tab" onclick="switchNav('bm',this)">★ Bookmarks</div>
</div>

<div class="ws">

<!-- ═══ VISUALIZER ═══ -->
<div id="page-vis" class="page active">
  <div class="sidebar">
    <div class="sec-lbl"><div class="dot"></div>JSON Input</div>
    <textarea class="jin" id="jsonInput" placeholder='Paste JSON here...

{
  "user": "Rahul",
  "skills": ["JS","Python"]
}'></textarea>
    <div class="sb-acts">
      <button class="btn pri" onclick="visualize()">▶ Visualize</button>
      <button class="btn" onclick="fmtJson()">⎋ Format</button>
      <button class="btn" onclick="minJson()">⊡ Minify</button>
    </div>
    <div class="sec-lbl"><div class="dot" style="background:var(--green)"></div>API Request</div>
    <div class="api-sec">
      <div class="api-row">
        <select class="meth" id="apiMethod"><option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option></select>
        <input class="ipt" id="apiUrl" placeholder="https://api.example.com/data" />
      </div>
      <div class="api-row">
        <select class="auth-sel" id="authType"><option value="none">No Auth</option><option value="bearer">Bearer</option><option value="apikey">API Key</option><option value="basic">Basic</option></select>
        <input class="ipt" id="authVal" placeholder="Token / Key / user:pass" />
      </div>
      <input class="ipt" id="customHdrs" placeholder='Extra headers: {"X-Key":"val"}' />
      <textarea class="ipt body-ta" id="reqBody" placeholder="Request body (POST/PUT)..."></textarea>
      <div class="api-row">
        <button class="btn suc" style="flex:1" onclick="fetchApi()">⇩ Send Request</button>
        <button class="btn" onclick="saveCol()">💾 Save</button>
      </div>
    </div>
  </div>

  <div class="main">
    <div class="toolbar">
      <div class="srch-wrap">
        <span style="color:var(--muted);font-size:12px">🔎</span>
        <input class="srch" id="srchIn" placeholder="Search keys or values..." oninput="searchTree(this.value)" />
        <span class="mc" id="mc"></span>
      </div>
      <div class="vtoggles">
        <button class="vbtn active" id="vb-tree" onclick="switchView('tree')">Tree</button>
        <button class="vbtn" id="vb-graph" onclick="switchView('graph')">Graph</button>
        <button class="vbtn" id="vb-raw" onclick="switchView('raw')">Raw</button>
        <button class="vbtn" id="vb-schema" onclick="switchView('schema')">Schema</button>
        <button class="vbtn" id="vb-ts" onclick="switchView('ts')">TypeScript</button>
      </div>
    </div>
    <div class="ctabs">
      <div id="ct-tree" class="ctab active"><div class="tree-sc" id="treePanel"><div class="empty"><div class="eico">🌱</div><div class="etit">JSON Visualizer Pro</div><div class="esub">Paste JSON in the sidebar or fetch from an API URL.</div><div class="kbadge">Ctrl+Shift+J</div></div></div></div>
      <div id="ct-graph" class="ctab"><div class="graph-wrap" id="graphWrap"><canvas id="graphCanvas"></canvas><div class="graph-hint">Scroll to zoom · Drag to pan</div></div></div>
      <div id="ct-raw" class="ctab"><div class="cpanel" id="rawPanel"><span style="color:var(--muted)">Visualize JSON first...</span></div></div>
      <div id="ct-schema" class="ctab"><div class="ptoolbar"><button class="btn" onclick="cp('schemaPanel')">⎘ Copy Schema</button></div><div class="cpanel" id="schemaPanel"><span style="color:var(--muted)">Visualize JSON first...</span></div></div>
      <div id="ct-ts" class="ctab"><div class="ptoolbar"><button class="btn" onclick="cp('tsPanel')">⎘ Copy TypeScript</button></div><div class="cpanel" id="tsPanel"><span style="color:var(--muted)">Visualize JSON first...</span></div></div>
    </div>
  </div>
</div>

<!-- ═══ DIFF ═══ -->
<div id="page-diff" class="page" style="flex-direction:column">
  <div class="diff-layout">
    <div class="diff-pane"><div class="diff-hdr" style="color:var(--green)">● JSON A (Original)</div><textarea id="diffA" placeholder='{"name":"Alice","age":25}'></textarea></div>
    <div class="diff-pane"><div class="diff-hdr" style="color:var(--red)">● JSON B (Modified)</div><textarea id="diffB" placeholder='{"name":"Bob","age":26,"city":"Delhi"}'></textarea></div>
  </div>
  <div style="padding:8px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;gap:8px">
    <button class="btn pri" onclick="runDiff()">⚡ Compare</button>
    <button class="btn" onclick="swapDiff()">⇅ Swap</button>
    <span id="diffSum" style="font-size:11px;color:var(--muted);align-self:center"></span>
  </div>
  <div class="diff-res" id="diffRes"><div class="empty"><div class="eico">⚡</div><div class="etit">JSON Diff Tool</div><div class="esub">Paste two JSONs above and click Compare.</div></div></div>
</div>

<!-- ═══ JSONPATH ═══ -->
<div id="page-jp" class="page" style="flex-direction:column">
  <div class="jp-bar">
    <span style="color:var(--muted);font-family:'JetBrains Mono',monospace;font-size:12px">$.</span>
    <input class="jp-in" id="jpIn" placeholder="users[*].name  or  store.book[0].title" oninput="runJP(this.value)" />
    <button class="btn pri" onclick="runJP(document.getElementById('jpIn').value)">▶ Run</button>
    <span id="jpCnt" style="font-size:11px;color:var(--muted);white-space:nowrap"></span>
  </div>
  <div style="padding:6px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;gap:5px;flex-wrap:wrap">
    <span style="font-size:10px;color:var(--muted);align-self:center">Quick:</span>
    <button class="btn" style="font-size:10px;padding:2px 7px" onclick="setJP('*')">*</button>
    <button class="btn" style="font-size:10px;padding:2px 7px" onclick="setJP('[0]')">[0]</button>
    <button class="btn" style="font-size:10px;padding:2px 7px" onclick="setJP('[*]')">[*]</button>
    <button class="btn" style="font-size:10px;padding:2px 7px" onclick="setJP('..name')">..(key)</button>
  </div>
  <div class="jp-res" id="jpRes"><div class="empty"><div class="eico">🔍</div><div class="etit">JSONPath Runner</div><div class="esub">Visualize a JSON first, then run queries here.</div></div></div>
</div>

<!-- ═══ CONVERT ═══ -->
<div id="page-conv" class="page" style="flex-direction:column">
  <div style="padding:10px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn pri" onclick="convertTo('csv')">→ CSV</button>
    <button class="btn pri" onclick="convertTo('xml')">→ XML</button>
    <button class="btn pri" onclick="convertTo('yaml')">→ YAML</button>
    <button class="btn pri" onclick="convertTo('ts')">→ TypeScript</button>
    <button class="btn pri" onclick="convertTo('schema')">→ JSON Schema</button>
    <button class="btn" onclick="cp('convPanel')">⎘ Copy Result</button>
  </div>
  <div class="cpanel" id="convPanel"><div class="empty"><div class="eico">🔄</div><div class="etit">Convert Tool</div><div class="esub">Visualize a JSON first, then convert it to any format.</div></div></div>
</div>

<!-- ═══ HISTORY ═══ -->
<div id="page-hist" class="page" style="flex-direction:column">
  <div style="padding:8px 14px;border-bottom:1px solid var(--border);background:var(--surface);display:flex">
    <span style="font-size:12px;color:var(--muted);align-self:center">Last 15 sessions</span>
    <button class="btn dan" style="margin-left:auto" onclick="clearHist()">✕ Clear</button>
  </div>
  <div class="slist" id="histList"><div class="elist">No history yet.</div></div>
</div>

<!-- ═══ BOOKMARKS ═══ -->
<div id="page-bm" class="page" style="flex-direction:column">
  <div style="padding:8px 14px;border-bottom:1px solid var(--border);background:var(--surface)">
    <span style="font-size:12px;color:var(--muted)">Saved JSON snippets</span>
  </div>
  <div class="slist" id="bmList"><div class="elist">No bookmarks yet. Click ★ Bookmark to save.</div></div>
</div>

</div><!-- /ws -->

<div class="stats" id="statsBar" style="display:none">
  <span>🔑 Keys: <span class="sv" id="sK">0</span></span>
  <span>📦 Arrays: <span class="sv" id="sA">0</span></span>
  <span>🧱 Objects: <span class="sv" id="sO">0</span></span>
  <span>📏 Depth: <span class="sv" id="sD">0</span></span>
  <span>💾 Size: <span class="sv" id="sSz">-</span></span>
  <span style="color:var(--green)">✓ Valid JSON</span>
</div>

<div class="toast" id="toast"></div>

<script>
const vsc = acquireVsCodeApi();
let cJson=null, mJson=null, curView='tree';
let hist=JSON.parse(localStorage.getItem('jvh')||'[]');
let bmarks=JSON.parse(localStorage.getItem('jvb')||'[]');
let st={};
let gNodes=[],gEdges=[],gPan={x:40,y:40},gZoom=1,gDrag=false,gDS={};
const DC=['#58a6ff','#3fb950','#ffa657','#d2a8ff','#ff7b72','#e3b341'];

// ── NAV ──
function switchNav(p,el){
  document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.page').forEach(pg=>pg.classList.remove('active'));
  document.getElementById('page-'+p).classList.add('active');
  if(p==='hist')renderHist();
  if(p==='bm')renderBM();
}

// ── VIEW ──
function switchView(v){
  curView=v;
  document.querySelectorAll('.vbtn').forEach(b=>b.classList.remove('active'));
  document.getElementById('vb-'+v)?.classList.add('active');
  document.querySelectorAll('.ctab').forEach(t=>t.classList.remove('active'));
  document.getElementById('ct-'+v)?.classList.add('active');
  if(v==='graph'&&cJson)drawGraph();
  if(v==='schema'&&cJson)renderSchema();
  if(v==='ts'&&cJson)renderTS();
}

// ── VISUALIZE ──
function visualize(){
  const raw=document.getElementById('jsonInput').value.trim();
  if(!raw){showErr('Paste or fetch JSON first!');return;}
  try{const j=JSON.parse(raw);renderJson(j,raw);addHist(raw);}
  catch(e){showErr('Invalid JSON:\\n'+e.message);}
}

function renderJson(j,raw){
  cJson=j; mJson=JSON.parse(JSON.stringify(j));
  st={keys:0,arrays:0,objects:0,depth:0};
  const p=document.getElementById('treePanel');
  p.innerHTML='';p.appendChild(buildNode(j,null,'$',0));
  document.getElementById('rawPanel').innerHTML=synHL(JSON.stringify(j,null,2));
  countSt(j,0);
  document.getElementById('sK').textContent=st.keys;
  document.getElementById('sA').textContent=st.arrays;
  document.getElementById('sO').textContent=st.objects;
  document.getElementById('sD').textContent=st.depth;
  document.getElementById('sSz').textContent=fmtB(new Blob([raw||JSON.stringify(j)]).size);
  document.getElementById('statsBar').style.display='flex';
  if(curView==='graph')drawGraph();
  if(curView==='schema')renderSchema();
  if(curView==='ts')renderTS();
  toast('JSON visualized!');
}

function countSt(v,d){
  st.depth=Math.max(st.depth,d);
  if(v===null||typeof v!=='object'){st.keys++;return;}
  if(Array.isArray(v)){st.arrays++;v.forEach(x=>countSt(x,d+1));}
  else{st.objects++;Object.values(v).forEach(x=>countSt(x,d+1));}
}

// ── TREE ──
function buildNode(val,key,path,depth){
  const wrap=document.createElement('div');
  wrap.className='tree-node';
  const t=gt(val);

  if(t==='object'||t==='array'){
    const entries=t==='array'?val.map((v,i)=>[i,v]):Object.entries(val);
    const row=document.createElement('div');
    row.className='tree-row d'+Math.min(depth,5);
    const tog=mk('span','tog open','▶');
    const ra=document.createElement('div');ra.className='racts';
    const cpb=mk('button','rab','⎘ Path');
    cpb.onclick=e=>{e.stopPropagation();vsc.postMessage({type:'copyToClipboard',text:path});};
    ra.appendChild(cpb);
    row.appendChild(tog);
    if(key!==null){row.appendChild(mk('span','nkey',typeof key==='number'?'['+key+']':'"'+key+'"'));row.appendChild(mk('span','ncol',':'));}
    row.appendChild(mk('span','tpill '+(t==='object'?'po':'pa'),t.toUpperCase()));
    row.appendChild(mk('span','cchip',entries.length+(t==='array'?' items':' keys')));
    row.appendChild(ra);
    wrap.appendChild(row);
    const kids=document.createElement('div');kids.className='kids';
    entries.forEach(([k,v])=>kids.appendChild(buildNode(v,k,path+'.'+k,depth+1)));
    wrap.appendChild(kids);
    row.addEventListener('click',e=>{if(e.target.classList.contains('rab'))return;const c=kids.classList.toggle('col');tog.classList.toggle('open',!c);});
  } else {
    const row=document.createElement('div');row.className='tree-row d'+Math.min(depth,5);
    const ve=document.createElement('span');ve.className='v'+(t==='null'?'nu':t==='boolean'?'b':t==='number'?'n':'s');
    ve.textContent=t==='string'?'"'+val+'"':String(val);
    const ra=document.createElement('div');ra.className='racts';
    const cv=mk('button','rab','⎘ Value');cv.onclick=e=>{e.stopPropagation();vsc.postMessage({type:'copyToClipboard',text:String(val)});};
    const eb=mk('button','rab','✎ Edit');
    eb.onclick=e=>{
      e.stopPropagation();
      const inp=document.createElement('input');inp.className='edit-in';inp.value=String(val);
      inp.style.width=Math.max(80,String(val).length*8)+'px';
      ve.replaceWith(inp);inp.focus();
      inp.onblur=()=>{let nv=inp.value;try{nv=JSON.parse(nv);}catch(e){}setPath(mJson,path,nv);ve.textContent=t==='string'?'"'+nv+'"':String(nv);inp.replaceWith(ve);row.classList.add('edited');toast('Value updated! Export JSON to save.');};
      inp.onkeydown=e=>{if(e.key==='Enter')inp.blur();if(e.key==='Escape')inp.replaceWith(ve);};
    };
    const cpb=mk('button','rab','⎘ Path');cpb.onclick=e=>{e.stopPropagation();vsc.postMessage({type:'copyToClipboard',text:path});};
    ra.appendChild(cv);ra.appendChild(eb);ra.appendChild(cpb);
    row.appendChild(mk('span','tog sp','▶'));
    if(key!==null){row.appendChild(mk('span','nkey',typeof key==='number'?'['+key+']':'"'+key+'"'));row.appendChild(mk('span','ncol',':'));}
    row.appendChild(ve);
    row.appendChild(mk('span','tpill p'+(t==='null'?'nu':t==='boolean'?'b':t==='number'?'n':'s'),t));
    row.appendChild(ra);wrap.appendChild(row);
  }
  return wrap;
}

function setPath(obj,path,val){
  const parts=path.replace(/^\\\$\\.?/,'').split(/\\.(?![^\\[]*\\])|\\[|\\]/).filter(Boolean);
  let cur=obj;
  for(let i=0;i<parts.length-1;i++)cur=cur[isNaN(parts[i])?parts[i]:+parts[i]];
  const l=parts[parts.length-1];cur[isNaN(l)?l:+l]=val;
}

// ── GRAPH ──
function drawGraph(){
  const cv=document.getElementById('graphCanvas');
  const wr=document.getElementById('graphWrap');
  cv.width=wr.clientWidth;cv.height=wr.clientHeight;
  const ctx=cv.getContext('2d');
  gNodes=[];gEdges=[];let nid=0;

  function trav(val,pid,lbl,x,y,d){
    const id=nid++;const t=gt(val);
    const txt=lbl+(t==='object'||t==='array'?(t==='array'?' ['+val.length+']':' {'+Object.keys(val).length+'}'):': '+String(val).slice(0,15));
    gNodes.push({id,x,y,txt,t,d});
    if(pid!==null)gEdges.push({f:pid,t:id});
    if((t==='object'||t==='array')&&d<4){
      const ents=t==='array'?val.map((v,i)=>[i,v]):Object.entries(val);
      const sp=Math.max(60,ents.length*55);
      ents.forEach(([k,v],i)=>trav(v,id,String(k),x+180,y-sp/2+(i/Math.max(1,ents.length-1))*sp,d+1));
    }
  }
  trav(cJson,null,'root',80,cv.height/2,0);

  function render(){
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.save();ctx.translate(gPan.x,gPan.y);ctx.scale(gZoom,gZoom);
    gEdges.forEach(e=>{
      const f=gNodes.find(n=>n.id===e.f),t=gNodes.find(n=>n.id===e.t);
      if(!f||!t)return;
      ctx.beginPath();ctx.moveTo(f.x+70,f.y);
      const cx=(f.x+t.x)/2+70;
      ctx.bezierCurveTo(cx,f.y,cx,t.y,t.x,t.y);
      ctx.strokeStyle='rgba(48,54,61,0.85)';ctx.lineWidth=1.5;ctx.stroke();
    });
    gNodes.forEach(n=>{
      const col=DC[n.d%DC.length];
      const txt=n.txt.length>22?n.txt.slice(0,22)+'…':n.txt;
      const w=Math.max(80,Math.min(160,ctx.measureText(txt).width+24));const h=26;
      ctx.save();ctx.shadowColor=col+'44';ctx.shadowBlur=8;
      ctx.beginPath();ctx.roundRect(n.x-w/2,n.y-h/2,w,h,5);
      ctx.fillStyle='#1c2128';ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.stroke();
      ctx.restore();
      ctx.fillStyle=col;ctx.font='11px JetBrains Mono,monospace';
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(txt,n.x,n.y);
    });
    ctx.restore();
  }
  render();
  cv.onwheel=e=>{e.preventDefault();gZoom=Math.max(.2,Math.min(3,gZoom-e.deltaY*.001));render();};
  cv.onmousedown=e=>{gDrag=true;gDS={x:e.clientX-gPan.x,y:e.clientY-gPan.y};};
  cv.onmousemove=e=>{if(!gDrag)return;gPan.x=e.clientX-gDS.x;gPan.y=e.clientY-gDS.y;render();};
  cv.onmouseup=cv.onmouseleave=()=>gDrag=false;
}

// ── SEARCH ──
function searchTree(q){
  document.querySelectorAll('#treePanel .tree-row').forEach(r=>{
    r.classList.remove('smatch');
    if(q&&r.textContent.toLowerCase().includes(q.toLowerCase())){
      r.classList.add('smatch');
      let el=r.parentElement;
      while(el&&el.id!=='treePanel'){
        if(el.classList.contains('kids')){el.classList.remove('col');const t=el.previousElementSibling?.querySelector('.tog');if(t)t.classList.add('open');}
        el=el.parentElement;
      }
    }
  });
  const c=document.querySelectorAll('.smatch').length;
  document.getElementById('mc').textContent=q?c+' matches':'';
}

// ── SCHEMA ──
function renderSchema(){
  if(!cJson)return;
  document.getElementById('schemaPanel').innerHTML=synHL(JSON.stringify(genSchema(cJson,'Root'),null,2));
}
function genSchema(v,title){
  const t=gt(v);
  if(t==='null')return{type:'null'};
  if(t==='string')return{type:'string',example:v};
  if(t==='number')return{type:Number.isInteger(v)?'integer':'number',example:v};
  if(t==='boolean')return{type:'boolean',example:v};
  if(t==='array'){return{type:'array',items:v.length>0?genSchema(v[0]):{}};}
  const props={};Object.entries(v).forEach(([k,x])=>{props[k]=genSchema(x);});
  return{type:'object',title,required:Object.keys(v),properties:props};
}

// ── TYPESCRIPT ──
function renderTS(){
  if(!cJson)return;
  const ts=genTS(cJson,'Root')||'// No interfaces to generate';
  document.getElementById('tsPanel').innerHTML='<span style="color:var(--purple)">'+esc(ts)+'</span>';
}
function genTS(v,name){
  const t=gt(v);if(t!=='object'&&t!=='array')return'';
  let out='';
  if(t==='object'){
    out+='interface '+pascal(name)+' {\\n';
    Object.entries(v).forEach(([k,x])=>{
      const vt=gt(x);let tt;
      if(vt==='object')tt=pascal(k);
      else if(vt==='array')tt=(x.length>0&&gt(x[0])==='object')?pascal(k+'Item')+'[]':tsT(x[0])+'[]';
      else tt=tsT(x);
      out+='  '+k+': '+tt+';\\n';
    });
    out+='}\\n\\n';
    Object.entries(v).forEach(([k,x])=>{if(gt(x)==='object')out+=genTS(x,k);else if(gt(x)==='array'&&x.length>0&&gt(x[0])==='object')out+=genTS(x[0],k+'Item');});
  } else if(t==='array'&&v.length>0&&gt(v[0])==='object'){
    out+=genTS(v[0],name+'Item');out+='type '+pascal(name)+' = '+pascal(name+'Item')+'[];\\n';
  }
  return out;
}
function tsT(v){const t=gt(v);return t==='string'?'string':t==='number'?'number':t==='boolean'?'boolean':t==='null'?'null':'unknown';}
function pascal(s){return String(s).charAt(0).toUpperCase()+String(s).slice(1).replace(/_([a-z])/g,(_,c)=>c.toUpperCase());}

// ── DIFF ──
function runDiff(){
  const a=document.getElementById('diffA').value.trim(),b=document.getElementById('diffB').value.trim();
  let ja,jb;
  try{ja=JSON.parse(a);}catch(e){document.getElementById('diffRes').innerHTML='<div class="errbox">JSON A invalid: '+e.message+'</div>';return;}
  try{jb=JSON.parse(b);}catch(e){document.getElementById('diffRes').innerHTML='<div class="errbox">JSON B invalid: '+e.message+'</div>';return;}
  const diffs=[];diffObj(ja,jb,'$',diffs);
  const add=diffs.filter(d=>d.type==='added').length,rem=diffs.filter(d=>d.type==='removed').length,ch=diffs.filter(d=>d.type==='changed').length;
  document.getElementById('diffSum').innerHTML='<span style="color:var(--green)">+'+add+' added</span> &nbsp;<span style="color:var(--red)">-'+rem+' removed</span> &nbsp;<span style="color:var(--orange)">~'+ch+' changed</span>';
  if(!diffs.length){document.getElementById('diffRes').innerHTML='<div style="color:var(--green);padding:20px;font-size:14px;font-weight:600">✓ JSONs are identical!</div>';return;}
  document.getElementById('diffRes').innerHTML=diffs.map(d=>{
    if(d.type==='added')return'<span class="da">+ <span class="dk">'+d.path+'</span>: '+esc(JSON.stringify(d.val))+'</span>';
    if(d.type==='removed')return'<span class="dr">- <span class="dk">'+d.path+'</span>: '+esc(JSON.stringify(d.val))+'</span>';
    return'<span style="display:block;padding:0 4px"><span style="color:var(--orange)">~ <span class="dk">'+d.path+'</span>:</span> <span style="color:var(--red)">'+esc(JSON.stringify(d.from))+'</span> → <span style="color:var(--green)">'+esc(JSON.stringify(d.to))+'</span></span>';
  }).join('');
}
function diffObj(a,b,path,out){
  if(typeof a!==typeof b||gt(a)!==gt(b)){out.push({type:'changed',path,from:a,to:b});return;}
  if(typeof a!=='object'||a===null){if(a!==b)out.push({type:'changed',path,from:a,to:b});return;}
  if(Array.isArray(a)){const max=Math.max(a.length,b.length);for(let i=0;i<max;i++){if(i>=a.length)out.push({type:'added',path:path+'['+i+']',val:b[i]});else if(i>=b.length)out.push({type:'removed',path:path+'['+i+']',val:a[i]});else diffObj(a[i],b[i],path+'['+i+']',out);}return;}
  const keys=new Set([...Object.keys(a),...Object.keys(b)]);
  keys.forEach(k=>{if(!(k in a))out.push({type:'added',path:path+'.'+k,val:b[k]});else if(!(k in b))out.push({type:'removed',path:path+'.'+k,val:a[k]});else diffObj(a[k],b[k],path+'.'+k,out);});
}
function swapDiff(){const a=document.getElementById('diffA').value,b=document.getElementById('diffB').value;document.getElementById('diffA').value=b;document.getElementById('diffB').value=a;}

// ── JSONPATH ──
function setJP(p){document.getElementById('jpIn').value=p;runJP(p);}
function runJP(expr){
  if(!cJson){document.getElementById('jpRes').innerHTML='<div class="errbox">Visualize a JSON first!</div>';return;}
  if(!expr.trim()){document.getElementById('jpRes').innerHTML='';document.getElementById('jpCnt').textContent='';return;}
  try{
    const res=jpQuery(cJson,expr.trim());
    document.getElementById('jpCnt').textContent=res.length+' result'+(res.length!==1?'s':'');
    if(!res.length){document.getElementById('jpRes').innerHTML='<div style="color:var(--muted);padding:20px">No matches found.</div>';return;}
    document.getElementById('jpRes').innerHTML=res.map((r,i)=>'<div class="jp-match"><div class="jp-path">Match '+(i+1)+': '+r.path+'</div><div style="color:var(--accent)">'+synHL(JSON.stringify(r.value,null,2))+'</div></div>').join('');
  }catch(e){document.getElementById('jpRes').innerHTML='<div class="errbox">'+e.message+'</div>';}
}
function jpQuery(json,expr){
  const res=[];
  function q(val,path,parts){
    if(!parts.length){res.push({path,value:val});return;}
    const p=parts[0],rest=parts.slice(1);
    if(p==='*'||p==='[*]'){if(typeof val==='object'&&val!==null){const ents=Array.isArray(val)?val.map((v,i)=>[i,v]):Object.entries(val);ents.forEach(([k,v])=>q(v,path+'.'+k,rest));}}
    else if(p.startsWith('[')&&p.endsWith(']')){const idx=parseInt(p.slice(1,-1));if(Array.isArray(val)&&val[idx]!==undefined)q(val[idx],path+'['+idx+']',rest);}
    else if(p.startsWith('..')){const key=p.slice(2);function ds(v,p2){if(typeof v!=='object'||v===null)return;if(!Array.isArray(v)&&key in v)res.push({path:p2+'.'+key,value:v[key]});const ents=Array.isArray(v)?v.map((x,i)=>[i,x]):Object.entries(v);ents.forEach(([k,x])=>ds(x,p2+'.'+k));}ds(val,path);}
    else{if(typeof val==='object'&&val!==null&&!Array.isArray(val)&&p in val)q(val[p],path+'.'+p,rest);}
  }
  const norm=expr.replace(/\\[([^\\]]+)\\]/g,'.[\\$1]');
  q(json,'$',norm.split('.').filter(Boolean));
  return res;
}

// ── CONVERT ──
function convertTo(fmt){
  if(!cJson){document.getElementById('convPanel').innerHTML='<div class="errbox">Visualize a JSON first!</div>';return;}
  let r='';
  try{
    if(fmt==='csv')r=toCSV(cJson);
    else if(fmt==='xml')r=toXML(cJson,'root');
    else if(fmt==='yaml')r=toYAML(cJson,0);
    else if(fmt==='ts')r=genTS(cJson,'Root')||'// No interfaces generated';
    else if(fmt==='schema')r=JSON.stringify(genSchema(cJson,'Root'),null,2);
    document.getElementById('convPanel').innerHTML='<pre style="color:var(--text)">'+esc(r)+'</pre>';
  }catch(e){document.getElementById('convPanel').innerHTML='<div class="errbox">Error: '+e.message+'</div>';}
}
function toCSV(j){
  const arr=Array.isArray(j)?j:[j];if(!arr.length)return'';
  const flat=arr.map(flatO);const hdrs=[...new Set(flat.flatMap(Object.keys))];
  return[hdrs.join(','),...flat.map(row=>hdrs.map(h=>JSON.stringify(row[h]??'')).join(','))].join('\\n');
}
function flatO(obj,prefix=''){let o={};for(const[k,v]of Object.entries(obj||{})){const key=prefix?prefix+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))Object.assign(o,flatO(v,key));else o[key]=v;}return o;}
function toXML(v,tag){const s=String(tag).replace(/[^a-zA-Z0-9_\\-]/g,'_');if(v===null||typeof v!=='object')return'<'+s+'>'+esc(String(v))+'</'+s+'>';if(Array.isArray(v))return v.map((x,i)=>toXML(x,tag+'_'+i)).join('\\n');const inner=Object.entries(v).map(([k,x])=>'  '+toXML(x,k)).join('\\n');return'<'+s+'>\\n'+inner+'\\n</'+s+'>';}
function toYAML(v,ind){const p='  '.repeat(ind);if(v===null)return'null';if(typeof v==='boolean')return String(v);if(typeof v==='number')return String(v);if(typeof v==='string')return v.includes(':')||v.includes('#')?'"'+v+'"':v;if(Array.isArray(v))return v.map(x=>p+'- '+toYAML(x,ind+1)).join('\\n');return Object.entries(v).map(([k,x])=>{const ct=gt(x);if(ct==='object'||ct==='array')return p+k+':\\n'+toYAML(x,ind+1);return p+k+': '+toYAML(x,ind+1);}).join('\\n');}

// ── API FETCH ──
async function fetchApi(){
  const url=document.getElementById('apiUrl').value.trim();
  if(!url){showErr('Enter an API URL first!');return;}
  const method=document.getElementById('apiMethod').value;
  const at=document.getElementById('authType').value,av=document.getElementById('authVal').value.trim();
  const hdrs={'Content-Type':'application/json'};
  if(at==='bearer'&&av)hdrs['Authorization']='Bearer '+av;
  if(at==='apikey'&&av)hdrs['X-API-Key']=av;
  if(at==='basic'&&av)hdrs['Authorization']='Basic '+btoa(av);
  try{const ch=document.getElementById('customHdrs').value.trim();if(ch)Object.assign(hdrs,JSON.parse(ch));}catch(e){}
  document.getElementById('treePanel').innerHTML='<div class="loading"><div class="spin"></div>Sending '+method+'...</div>';
  try{
    const opts={method,headers:hdrs};
    const body=document.getElementById('reqBody').value.trim();
    if(body&&['POST','PUT','PATCH'].includes(method))opts.body=body;
    const res=await fetch(url,opts);
    if(!res.ok)throw new Error('HTTP '+res.status+' '+res.statusText);
    const j=await res.json();const raw=JSON.stringify(j,null,2);
    document.getElementById('jsonInput').value=raw;renderJson(j,raw);addHist(raw,url);
  }catch(e){showErr('Fetch failed: '+e.message);}
}

// ── HISTORY & BOOKMARKS ──
function addHist(raw,lbl){
  hist.unshift({raw,lbl:(lbl||raw.slice(0,45).replace(/\\s+/g,' ')+'...'),t:new Date().toLocaleTimeString()});
  if(hist.length>15)hist.pop();localStorage.setItem('jvh',JSON.stringify(hist));
}
function renderHist(){
  const el=document.getElementById('histList');
  if(!hist.length){el.innerHTML='<div class="elist">No history yet.</div>';return;}
  el.innerHTML=hist.map((h,i)=>'<div class="li" onclick="loadH('+i+')"><div><div class="li-lbl">'+esc(h.lbl)+'</div><div class="li-meta">'+h.t+'</div></div><span class="li-del" onclick="event.stopPropagation();delH('+i+')">✕</span></div>').join('');
}
function loadH(i){document.getElementById('jsonInput').value=hist[i].raw;switchNav('vis',document.querySelector('.nav-tab'));visualize();}
function delH(i){hist.splice(i,1);localStorage.setItem('jvh',JSON.stringify(hist));renderHist();}
function clearHist(){hist=[];localStorage.setItem('jvh','[]');renderHist();}
function bookmarkCurrent(){
  if(!cJson){toast('Nothing to bookmark!');return;}
  const name=prompt('Bookmark name:','My JSON '+(bmarks.length+1));if(!name)return;
  bmarks.push({name,raw:JSON.stringify(cJson,null,2),t:new Date().toLocaleDateString()});
  localStorage.setItem('jvb',JSON.stringify(bmarks));toast('Bookmarked: '+name);
}
function renderBM(){
  const el=document.getElementById('bmList');
  if(!bmarks.length){el.innerHTML='<div class="elist">No bookmarks yet.</div>';return;}
  el.innerHTML=bmarks.map((b,i)=>'<div class="li" onclick="loadBM('+i+')"><div><div class="li-lbl">'+esc(b.name)+'</div><div class="li-meta">'+b.t+'</div></div><span class="li-del" onclick="event.stopPropagation();delBM('+i+')">✕</span></div>').join('');
}
function loadBM(i){document.getElementById('jsonInput').value=bmarks[i].raw;switchNav('vis',document.querySelector('.nav-tab'));visualize();}
function delBM(i){bmarks.splice(i,1);localStorage.setItem('jvb',JSON.stringify(bmarks));renderBM();}
function saveCol(){const url=document.getElementById('apiUrl').value.trim();if(!url){toast('Enter a URL first!');return;}toast('Collection saved!');}

// ── UTILS ──
function expandAll(){document.querySelectorAll('.kids').forEach(c=>c.classList.remove('col'));document.querySelectorAll('.tog:not(.sp)').forEach(t=>t.classList.add('open'));}
function collapseAll(){document.querySelectorAll('.kids').forEach(c=>c.classList.add('col'));document.querySelectorAll('.tog:not(.sp)').forEach(t=>t.classList.remove('open'));}
function fmtJson(){try{document.getElementById('jsonInput').value=JSON.stringify(JSON.parse(document.getElementById('jsonInput').value),null,2);}catch(e){showErr('Invalid JSON: '+e.message);}}
function minJson(){try{document.getElementById('jsonInput').value=JSON.stringify(JSON.parse(document.getElementById('jsonInput').value));}catch(e){showErr('Invalid JSON: '+e.message);}}
function copyFormatted(){if(!cJson)return;vsc.postMessage({type:'copyToClipboard',text:JSON.stringify(cJson,null,2)});}
function exportModified(){if(!mJson)return;vsc.postMessage({type:'copyToClipboard',text:JSON.stringify(mJson,null,2)});toast('Modified JSON copied!');}
function cp(id){const el=document.getElementById(id);if(el)vsc.postMessage({type:'copyToClipboard',text:el.innerText});}
function showErr(msg){document.getElementById('treePanel').innerHTML='<div class="errbox">❌ '+msg+'</div>';}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
function fmtB(b){if(b<1024)return b+' B';if(b<1048576)return(b/1024).toFixed(1)+' KB';return(b/1048576).toFixed(1)+' MB';}
function gt(v){if(v===null)return'null';if(Array.isArray(v))return'array';return typeof v;}
function mk(tag,cls,txt){const el=document.createElement(tag);el.className=cls;if(txt!==undefined)el.textContent=txt;return el;}
function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function synHL(str){return esc(str).replace(/("(\\\\u[a-zA-Z0-9]{4}|\\\\[^u]|[^\\\\"])*"(\\s*:)?|\\b(true|false|null)\\b|-?\\d+(?:\\.\\d*)?(?:[eE][+\\-]?\\d+)?)/g,m=>{let c='vn';if(/^"/.test(m)||/^&quot/.test(m))c=/:/.test(m)?'nkey':'vs';else if(/true|false/.test(m))c='vb';else if(/null/.test(m))c='vnu';return'<span class="'+c+'">'+m+'</span>';});}
function clearAll(){
  cJson=null;mJson=null;
  document.getElementById('jsonInput').value='';
  document.getElementById('apiUrl').value='';
  document.getElementById('srchIn').value='';
  document.getElementById('mc').textContent='';
  document.getElementById('treePanel').innerHTML='<div class="empty"><div class="eico">🌱</div><div class="etit">JSON Visualizer Pro</div><div class="esub">Paste JSON or fetch from an API URL.</div></div>';
  document.getElementById('rawPanel').innerHTML='<span style="color:var(--muted)">Visualize JSON first...</span>';
  document.getElementById('schemaPanel').innerHTML='<span style="color:var(--muted)">Visualize JSON first...</span>';
  document.getElementById('tsPanel').innerHTML='<span style="color:var(--muted)">Visualize JSON first...</span>';
  document.getElementById('statsBar').style.display='none';
}

document.getElementById('jsonInput').addEventListener('paste',()=>setTimeout(visualize,100));
document.getElementById('apiUrl').addEventListener('keydown',e=>{if(e.key==='Enter')fetchApi();});
document.getElementById('jpIn').addEventListener('keydown',e=>{if(e.key==='Enter')runJP(e.target.value);});

window.addEventListener('message',e=>{
  const msg=e.data;
  if(msg.type==='loadJson'){document.getElementById('jsonInput').value=msg.data;visualize();}
  else if(msg.type==='fetchUrl'){document.getElementById('apiUrl').value=msg.url;fetchApi();}
});
</script>
</body>
</html>`;
}

export function deactivate() {}