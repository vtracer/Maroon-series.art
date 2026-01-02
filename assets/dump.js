const OWNER = "vtracer";
const REPO = "maroon-series.art";
const BRANCH = "main";
let CWD = "dump";
const crumbEl = document.getElementById('crumb');
const getCrumb = () => `C:\\nlt\\${CWD.replace(/\//g, '\\')}>`;
const updateCrumb = () => { if (crumbEl) crumbEl.textContent = getCrumb(); };
updateCrumb();

async function listLogs(path = CWD) {
  try {
    const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${encodeURI(path)}?ref=${BRANCH}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/vnd.github.v3+json" },
      cache: "no-store"
    });
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).message || ""; } catch {}
      throw new Error(`GitHub API error ${res.status} ${detail}`);
    }
    const body = await res.json();
    if (!Array.isArray(body)) throw new Error("Unexpected API shape");
    return body.map(it => ({
      name: it.name,
      url: it.download_url || "",
      type: it.type 
    }));
  } catch (err) {
    console.error(err);
    return [];
  }
}

function print(line = "") {
  const p = document.createElement("div");
  p.textContent = line;
  terminal.appendChild(p);
  terminal.scrollTop = terminal.scrollHeight;
}

function maybeCorrupt(line) {
  if (Math.random() < 0.2) return "[[CORRUPT BLOCK]] ▒▒▒▒▒▒▒▒▒";
  return line;
}

async function handleCommand(cmd) {
  const parts = cmd.trim().split(/\s+/);
  const base = (parts[0] || "").toLowerCase();

  if (base === "dir" || base === "ls") {
    print(getCrumb() + " " + cmd);
    const items = await listLogs(); 
    if (items.length === 0) {
      print("<error: cannot access server log>");
    } else {
      const dirs  = items.filter(i => i.type === "dir").sort((a,b)=>a.name.localeCompare(b.name));
      const files = items.filter(i => i.type === "file").sort((a,b)=>a.name.localeCompare(b.name));
      dirs.forEach(d  => print(" 📁 " + maybeCorrupt(d.name)));
      files.forEach(f => print(" "   + maybeCorrupt(f.name)));
    }

  } else if (base === "cd") {
    const target = (parts[1] || "").trim();
    if (!target) {
      print("usage: cd <dir> | cd ..");
    } else if (target === "..") {
      CWD = CWD.includes("/") ? CWD.split("/").slice(0,-1).join("/") : "dump";
    } else if (target === "/" || target === "dump") {
      CWD = "dump";
    } else {
      const items = await listLogs();
      const hit = items.find(i => i.type === "dir" && i.name === target);
      if (!hit) return print(`<error: no such directory: ${target}>`);
      CWD = `${CWD}/${target}`.replace(/\/+/g,"/");
    }
    updateCrumb();
    return handleCommand();

  } else if (base === "pwd") {
    print("/" + CWD);

  } else if (base === "open" && parts[1]) {
    const target = parts[1];
    const items = await listLogs();
    const match = items.find(f => f.name === target && f.type === "file");
    if (!match) return print(`<error: file not found: ${target}>`);
    print(`Opening ${match.name}...`);
    const href = match.url || (`/${CWD}/${match.name}`);
    window.open(href, "_blank", "noopener,noreferrer");

  } else if (base === "help") {
    print("Available commands:");
    print("  dir    - list items in current folder");
    print("  cd <dir>    - change directory (.. to go up)");
    print("  pwd         - show current path");
    print("  open <file> - open a file");
    print("  clear       - clear screen");

  } else if (base === "clear") {
    terminal.innerHTML = "";

  } else if (base) {
    print("Unknown command. Type 'help'.");
  }
}
commandInput.addEventListener("keydown", async (e) => {
  if (e.key === "Enter") {
    const cmd = commandInput.value;
    commandInput.value = "";
    if (cmd.trim()) await handleCommand(cmd);
  }
});
print(`Welcome to New Life Technologies Central Database, to start type 'help'`);