/* ========= 🌍 GLOBAL VARIABLES ========= */
let currentView = "home";
let currentBatch = "";
let chatPartner = "";
let myRole = "trainer";        // 👈 FIXED
let chattingWithRole = "";    // 👈 FIXED


/* ========= 🏠 HOME ========= */
function showHome(){
  currentView = "home";
  document.getElementById("content").innerHTML = "<h3>Loading...</h3>";
  AndroidBridge.getAssignedBatches();
}

function showAssignedBatches(data){
  const list = JSON.parse(data || "{}");
  let html = `<h2>📌 Assigned Batches</h2>`;

  if(Object.keys(list).length === 0){
    html += `<p>No batches assigned yet.</p>`;
  } else {
    Object.keys(list).forEach(bid=>{
      let b = list[bid];
      html += `
        <div class="card">
          <h3>${b.batchName}</h3>
          <p><b>ID:</b> ${bid}</p>
          <p>📚 ${b.subject}</p>
          <p>⏱ ${b.time}</p>
          <button onclick="openGroupChat('${bid}')">💬 Open Batch Chat</button>
        </div>
      `;
    });
  }

  document.getElementById("content").innerHTML = html;
}

/* ========= 👤 PROFILE ========= */
function showProfile() {
  currentView = "profile";
  document.getElementById("content").innerHTML = `<p>Loading profile...</p>`;
  AndroidBridge.getUserProfile("trainer");
}

function showProfileDetails(data) {
  if(currentView !== "profile") return;
  try {
    const user = typeof data === "string" ? JSON.parse(data) : data;

    const pic = user.tProfilePic_Base64
      ? `data:image/png;base64,${user.tProfilePic_Base64}`
      : "default-avatar.png";

    document.getElementById("content").innerHTML = `
      <div class="card profileCard">
        <div style="text-align:center;">
          <img src="${pic}" style="width:120px;height:120px;border-radius:50%;border:2px solid #0057d9;">
          <h2>👤 ${user.tFullName || 'N/A'}</h2>
        </div>

        <hr><h3>📌 Basic Info</h3>
        <p><b>Email:</b> ${user.tEmail || 'N/A'}</p>
        <p><b>Mobile:</b> ${user.tMobile || 'N/A'}</p>
        <p><b>DOB:</b> ${user.tDob || 'N/A'}</p>
        <p><b>Gender:</b> ${user.tGender || 'N/A'}</p>
        <p><b>Address:</b> ${user.tStreet || ''}, ${user.tCity || ''}, ${user.tState || ''}</p>

        <hr><h3>🎓 Education</h3>
        <p><b>UG:</b> ${user.ugDegree || 'N/A'} (${user.ugStream || ''})</p>
        <p><b>PG:</b> ${user.pgDegree || 'N/A'} (${user.pgSpec || ''})</p>

        <hr><h3>💼 Work Details</h3>
        <p><b>Experience:</b> ${user.tExperience || 'N/A'}</p>
        <p><b>LinkedIn:</b> <a href="${user.tLinkedIn || '#'}" target="_blank">${user.tLinkedIn || 'N/A'}</a></p>

        <hr><h3>🏦 Bank Details</h3>
        <p><b>Account No:</b> ${user.accNumber || 'N/A'}</p>
        <p><b>IFSC:</b> ${user.ifsc || 'N/A'}</p>
        <p><b>Bank:</b> ${user.bankName || ''} ${user.branchName || ''}</p>
        <p><b>PAN:</b> ${user.pan || 'N/A'}</p>
        <p><b>Aadhar:</b> ${user.aadhar || 'N/A'}</p>
      </div>
    `;
  } catch(err){
    alert("❌ Profile Load Error");
    console.log(err);
  }
}

/* ========= 💬 GROUP CHAT ========= */
function openGroupChat(batchId){
  if(!batchId){ return alert("❌ Invalid Batch ID"); }

  currentView = "groupChat";
  currentBatch = batchId;

  document.getElementById("content").innerHTML = `
    <h2>📢 Group Chat - ${batchId}</h2>
    <div id="chatBox" class="chatArea" style="height:300px;overflow:auto;padding:10px;background:white;"></div>
    <input id="msgInput" placeholder="Type message...">
    <button onclick="sendGroupMsg()">Send</button>
  `;

  AndroidBridge.getGroupMessages(batchId);
}

function loadGroupMessages(data){
  const msgs = JSON.parse(data || "{}");
  let box = document.getElementById("chatBox");
  box.innerHTML = "";

  Object.keys(msgs).forEach(k=>{
    let m = msgs[k];
    const align = m.from === "trainer" ? "right" : "left";
    const bg = m.from === "trainer" ? "#dbe9ff" : "#f1f1f1";
    box.innerHTML += `<div style="text-align:${align}; margin:6px 0;">
      <span style="display:inline-block;padding:8px 12px;border-radius:12px;background:${bg};max-width:70%;">
        ${m.text}
      </span>
    </div>`;
  });

  box.scrollTop = box.scrollHeight;
}

function sendGroupMsg(){
   let text = document.getElementById("msgInput").value.trim();
   if(!text) return;

   AndroidBridge.sendGroupMessage(currentBatch, text, "trainer");
   document.getElementById("msgInput").value = "";
   AndroidBridge.getGroupMessages(currentBatch);
}

/* ========= 💬 PERSONAL CHAT ========= */
function showMessages() {
    currentView = "messages";

    document.getElementById("content").innerHTML = `
        <h2>💬 Messages</h2>

        <div class="card" onclick="openManagementChat()">
            <h3>🏢 Chat with Management</h3>
            <p>Direct messages with management</p>
        </div>

        <div class="card" onclick="openTrainerChat()">
            <h3>🎓 Chat with Trainer</h3>
            <p>Direct messages with trainer</p>
        </div>
    `;
}

function openManagementChat(){
    const managementId = "81e90a7f-8045-481f-8a6e-620a395eec47"; // real management UUID
    openPersonalChat(managementId, "management");
}

function openChatList(role){
    currentView = "chatList";
    document.getElementById("content").innerHTML = `<h3>Loading list...</h3>`;
    AndroidBridge.getUsersByRole(role);
}




// UNIVERSAL CHAT LIST HANDLER (SAFE)
let currentChatTo = "";
let currentChatRole = "";

/* ================= OPEN PERSONAL CHAT ================= */
function openPersonalChat(id, role){

    currentChatUser = id;
    currentChatRole = role;

    console.log("Opening chat with:", id);   // DEBUG
    console.log("My ID:", localStorage.getItem("uuid")); // DEBUG

    document.getElementById("content").innerHTML = `
        <h3>💬 Chat with ${role.toUpperCase()}</h3>
        <div id="chatMessages" class="chat-container"></div>

        <div class="chat-input-area">
          <input id="chatInput" placeholder="Type a message..."/>
          <button onclick="sendPersonalMessage()">➤</button>
        </div>
    `;

    AndroidBridge.getChatMessages(id);
}

/* ================= DISPLAY MESSAGES ================= */
function showPersonalChats(data){

    let raw;

    try{
        raw = typeof data === "string" ? JSON.parse(data) : data;
    }catch(e){
        console.error("Parse error:", e);
        raw = {};
    }

    const myId = localStorage.getItem("uuid");
    const box = document.getElementById("chatMessages");

    if(!box) return;

    box.innerHTML = "";

    if(!raw || Object.keys(raw).length === 0){
        box.innerHTML = "<p style='opacity:.5'>No messages yet</p>";
        return;
    }

    // 🔥 Convert OBJECT → ARRAY
    const msgs = Object.values(raw);

    msgs.sort((a,b)=>(a.timestamp||0)-(b.timestamp||0));

    msgs.forEach(m=>{

        const cls = m.senderId === myId
            ? "message-sent"
            : "message-received";

        box.innerHTML += `
            <div class="message-row">
                <div class="${cls}">
                    ${m.text || ""}
                    <div style="font-size:11px;opacity:.5">
                        ${m.timestamp
                          ? new Date(m.timestamp).toLocaleString()
                          : ""}
                    </div>
                </div>
            </div>
        `;
    });

    box.scrollTop = box.scrollHeight;
}
function displayChatList(role, data){

    const list = JSON.parse(data);
    let html = `<h2>💬 Chat with ${role}s</h2>`;

    Object.keys(list).forEach(id=>{

        let u = list[id];

        console.log("USER ID:", id);

        html += `
        <div class="card" onclick="openPersonalChat('${id}','${role}')">
            ${u.name}<br>
            <small>${u.email}</small>
        </div>`;
    });

    document.getElementById("content").innerHTML = html;
}
/* ================= SEND MESSAGE ================= */
function sendPersonalMessage(){

    const input = document.getElementById("chatInput");
    if(!input) return;

    const txt = input.value.trim();
    if(txt==="") return;

    console.log("Sending to:", currentChatUser);

    AndroidBridge.sendPersonalMessage(currentChatUser, txt);

    input.value="";
}

/* ========= 📌 REQUIREMENT ========= */
function showAddRequirement(){
  currentView = "req";

  document.getElementById("content").innerHTML = `
    <h2>📌 Add Requirement</h2>
    <div class="card requirement-card">
      <label>👨‍🎓 Select Student</label>
      <select id="reqStudent"></select>
      <label>🏢 Company Name</label><input type="text" id="reqCompany" placeholder="Company Name">
      <label>💼 Role</label><input type="text" id="reqRole" placeholder="Job Role">
      <label>📅 Date</label><input type="date" id="reqDate">
      <label>⏰ Time</label><input type="time" id="reqTime">
      <label>📝 Description</label><textarea id="reqDesc" rows="4" placeholder="Requirement details"></textarea>
      <button onclick="submitTrainerRequirement()">➕ Add Requirement</button>
    </div>
  `;

  AndroidBridge.getAllStudents();
}

function submitTrainerRequirement(){
  const studentId = document.getElementById("reqStudent").value;
  const company = document.getElementById("reqCompany").value.trim();
  const role = document.getElementById("reqRole").value.trim();
  const date = document.getElementById("reqDate").value;
  const time = document.getElementById("reqTime").value;
  const desc = document.getElementById("reqDesc").value.trim();

  if(!studentId || !company || !role){
    return alert("⚠️ Please fill required fields");
  }

  const obj = { company, role, date, time, description: desc, from: "trainer", timestamp: Date.now() };
  AndroidBridge.addRequirement(studentId, JSON.stringify(obj));
}

function onRequirementAdded(){
  alert("✅ Requirement added successfully!");
  document.getElementById("reqCompany").value = "";
  document.getElementById("reqRole").value = "";
  document.getElementById("reqDate").value = "";
  document.getElementById("reqTime").value = "";
  document.getElementById("reqDesc").value = "";
  document.getElementById("reqStudent").value = "";
}

/* ========= 🚪 LOGOUT ========= */
function logout(){
    const confirmLogout = confirm("⚠️ Are you sure you want to logout?");

    if(confirmLogout){
        // Optional: clear session data
        localStorage.clear();

        location.href = "index1.html";
    }
    // else → do nothing
}

/* ========= SIDEBAR TOGGLE ========= */
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const content = document.querySelector(".content-area");

    if (sidebar.classList.contains("closed")) {
        sidebar.classList.remove("closed");
        content.classList.remove("full");
    } else {
        sidebar.classList.add("closed");
        content.classList.add("full");
    }
}