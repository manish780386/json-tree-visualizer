# 🌳 JSON Tree Visualizer Pro

> **The ultimate JSON visualization tool for VS Code.** Instantly turn any JSON into an interactive tree, mind-map graph, diff view, and more — all without leaving your editor.

---

## ✨ Features at a Glance

| Feature | Description |
|---|---|
| 🌳 **Interactive Tree View** | Collapse/expand nodes, color-coded by depth, edit values inline |
| 🕸️ **Graph / Mind-Map View** | Canvas-based node graph with zoom and pan |
| ⚡ **JSON Diff Tool** | Compare two JSONs — see added, removed, and changed fields |
| 🔍 **JSONPath Query Runner** | Run `$.users[*].name` style queries and see results instantly |
| 🔄 **Format Converter** | Export JSON to CSV, XML, YAML, TypeScript interfaces, JSON Schema |
| 🌐 **Built-in API Client** | Send GET/POST/PUT/PATCH/DELETE requests with auth support |
| 🔐 **Auth Support** | Bearer Token, API Key, Basic Auth, custom headers |
| ✎ **Inline Editing** | Edit any value directly in the tree and export the modified JSON |
| 🕐 **History** | Last 15 visualized JSONs saved automatically |
| ★ **Bookmarks** | Save and reload frequently used JSON snippets |
| 📊 **Stats Bar** | Total keys, arrays, objects, depth, and file size at a glance |

---

## 🚀 Getting Started

### Open the Visualizer

| Method | Action |
|---|---|
| Keyboard shortcut | `Ctrl+Shift+J` (Windows/Linux) · `Cmd+Shift+J` (Mac) |
| Command Palette | `Ctrl+Shift+P` → type **JSON Tree Visualizer: Open** |
| Right-click | Select JSON text in editor → right-click → **Visualize Selected JSON** |

---

## 📖 How to Use

### Paste JSON
1. Open the visualizer with `Ctrl+Shift+J`
2. Paste any JSON into the left input panel
3. Click **▶ Visualize** — or just paste and it auto-renders

### Fetch from an API
1. Enter your API URL in the bottom input field
2. Select the HTTP method (GET, POST, PUT, etc.)
3. Add auth if needed (Bearer, API Key, Basic)
4. Click **⇩ Send Request**

### Edit Values in the Tree
1. Hover over any leaf node (string, number, boolean)
2. Click the **✎ Edit** button that appears
3. Type your new value and press `Enter`
4. Click **↓ Export JSON** in the header to copy the modified JSON

### Run a JSONPath Query
1. Switch to the **🔍 JSONPath** tab in the top nav
2. Type a query like `users[*].name` or `..email`
3. Press `Enter` — matching values are shown with their full paths

### Compare Two JSONs
1. Switch to the **⚡ JSON Diff** tab
2. Paste JSON A (original) on the left
3. Paste JSON B (modified) on the right
4. Click **⚡ Compare**

### Convert to Another Format
1. Switch to the **🔄 Convert** tab
2. Click any format button: **→ CSV**, **→ XML**, **→ YAML**, **→ TypeScript**, **→ JSON Schema**
3. Click **⎘ Copy Result** to copy the output

---

## 🎨 Tree View — Color Coding

Each depth level in the tree has a distinct color so you can instantly understand nesting:

| Depth | Color |
|---|---|
| Level 0 (root) | 🔵 Blue |
| Level 1 | 🟢 Green |
| Level 2 | 🟠 Orange |
| Level 3 | 🟣 Purple |
| Level 4 | 🔴 Red |
| Level 5+ | 🟡 Yellow |

---

## 🧪 Example API URLs to Test

```
https://jsonplaceholder.typicode.com/users
https://jsonplaceholder.typicode.com/posts/1
https://api.github.com/repos/microsoft/vscode
https://api.coindesk.com/v1/bpi/currentprice.json
```

---

## ⌨️ All Commands

| Command | Shortcut / Access |
|---|---|
| Open JSON Visualizer | `Ctrl+Shift+J` |
| Visualize Selected JSON | Select text → Right-click → context menu |
| Fetch from API URL | Command Palette → `JSON Tree Visualizer: Fetch from API URL` |

---

## 📁 Views Explained

### 🌳 Tree View
The default view. Every object and array is collapsible. Click any node to expand or collapse it. Hover to see inline action buttons:
- **⎘ Path** — copies the full JSONPath of that node to clipboard
- **⎘ Value** — copies the raw value to clipboard
- **✎ Edit** — edit the value inline (leaf nodes only)

### 🕸️ Graph View
A canvas-based mind-map of your JSON structure. Use mouse scroll to zoom in/out and drag to pan around. Great for understanding deeply nested data.

### { } Raw View
The full formatted JSON with syntax highlighting. Read-only.

### Schema View
Auto-generated JSON Schema from your data — useful for API documentation and validation.

### TypeScript View
Auto-generated TypeScript interfaces from your JSON — paste directly into your codebase.

---

## 💡 Tips

- **Auto-render on paste** — just paste JSON into the input box, it renders automatically
- **Press Enter** in the API URL field to trigger the request immediately
- **History** saves automatically — no need to re-paste the same JSON twice
- **Bookmark** important JSONs with a custom name for instant access later
- **Export JSON** after editing tree values to get the modified version

---

## 🛠️ Extension Info

- **Version:** 1.0.0
- **VS Code Engine:** ^1.85.0
- **Language:** TypeScript
- **No external dependencies** — works fully offline (except API fetch and Google Fonts)

---

## 📝 License

MIT License — free to use, modify, and distribute.

---

Made with ❤️ for developers who work with JSON every day.