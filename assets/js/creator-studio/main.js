const chatMessages = document.getElementById("chatMessages");
const chatInput = document.getElementById("chatInput");
const consoleBar = document.getElementById("console");
const previewFrame = document.getElementById("preview");

let editor;
let socket;

function logConsole(message) {
  consoleBar.textContent = message;
}

function addMessage(sender, text) {
  const node = document.createElement("div");
  node.className = `message ${sender}`;
  node.textContent = text;
  chatMessages.appendChild(node);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getEditorCode() {
  return editor ? editor.getValue() : "";
}

function setEditorCode(code) {
  if (!editor) return;
  editor.setValue(code || "");
}

function runPreview() {
  const code = getEditorCode();
  previewFrame.srcdoc = code;
  logConsole("Preview updated");
}

function saveLocal() {
  localStorage.setItem("creator-studio-code", getEditorCode());
  logConsole("Saved to localStorage");
}

async function sendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;

  addMessage("user", message);
  chatInput.value = "";
  logConsole("AI กำลังประมวลผล...");

  try {
    const response = await fetch("/api/creator/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    addMessage("ai", data.response || "รับคำสั่งแล้ว");
    if (data.code) {
      setEditorCode(data.code);
      runPreview();
    }
    logConsole("AI อัปเดตโค้ดเรียบร้อย");
  } catch (error) {
    logConsole(`ส่งข้อความไม่สำเร็จ: ${error.message}`);
    addMessage("ai", "เกิดข้อผิดพลาดในการเรียก API creator/chat");
  }
}

async function createPR() {
  const repo = window.prompt("ชื่อ repo (owner/repo):", "");
  if (!repo) return;
  const branch = window.prompt("ชื่อ branch:", "creator-studio/update-1");
  if (!branch) return;
  const message = window.prompt("ข้อความ commit และ PR title:", "Creator Studio update");
  if (!message) return;

  logConsole("กำลังสร้าง PR...");

  try {
    const response = await fetch("/api/creator/github-pr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        repo,
        branch,
        message,
        code: getEditorCode(),
      }),
    });

    const data = await response.json();
    if (data.pr_url) {
      logConsole(`PR ready: ${data.pr_url}`);
      window.alert(`สร้าง PR สำเร็จ: ${data.pr_url}`);
    } else {
      logConsole(data.message || "PR action completed");
      window.alert(data.message || "PR action completed");
    }
  } catch (error) {
    logConsole(`สร้าง PR ไม่สำเร็จ: ${error.message}`);
    window.alert("สร้าง PR ไม่สำเร็จ");
  }
}

function initMonaco() {
  window.require.config({
    paths: {
      vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
    },
  });

  window.require(["vs/editor/editor.main"], () => {
    const savedCode = localStorage.getItem("creator-studio-code");
    editor = window.monaco.editor.create(document.getElementById("editor"), {
      value:
        savedCode ||
        "<!doctype html>\n<html lang=\"th\">\n<head><meta charset=\"UTF-8\"><title>Creator Studio</title></head>\n<body>\n<h1>พร้อมสร้างแอป</h1>\n</body>\n</html>",
      language: "html",
      theme: "vs-dark",
      minimap: { enabled: false },
      fontSize: 14,
    });
    runPreview();
    addMessage("ai", "สวัสดีครับ ผมพร้อมช่วยออกแบบแอปและเขียนโค้ดแบบเรียลไทม์");
  });
}

function initRealtimeFeed() {
  try {
    socket = new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws/feed`);
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data?.event_type === "CODE_GEN_UPDATE") {
        logConsole("ได้รับ CODE_GEN_UPDATE จาก bus");
      }
    });
  } catch (_error) {
    logConsole("Realtime feed unavailable");
  }
}

document.getElementById("sendMessageBtn").addEventListener("click", sendMessage);
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});
document.getElementById("saveCodeBtn").addEventListener("click", saveLocal);
document.getElementById("runPreviewBtn").addEventListener("click", runPreview);
document.getElementById("createPrBtn").addEventListener("click", createPR);

initMonaco();
initRealtimeFeed();
