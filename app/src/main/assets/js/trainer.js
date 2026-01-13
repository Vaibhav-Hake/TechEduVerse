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
function showPersonalChat(){
  currentView = "personalChatMain";
  document.getElementById("content").innerHTML = `
    <h2>📱 Personal Chat</h2>
    <button onclick="loadManagement()">Chat with Management</button>
    <br><br>
    <button onclick="loadStudents()">Chat with Students</button>
  `;
}

function loadManagement(){
  chattingWithRole = "management"; // important
  currentView = "personalChat";
  AndroidBridge.getUsersByRole("management");
}

function loadStudents(){
  chattingWithRole = "trainee"; // important
  currentView = "personalChat";
  AndroidBridge.getUsersByRole("trainee");
}




// UNIVERSAL CHAT LIST HANDLER (SAFE)
function displayChatList(arg1, arg2){
  let data, role;

  // Case 1: Android sent (role, data)
  if(typeof arg1 === "string" && arg2){
    role = arg1;
    data = arg2;
  }
  // Case 2: Android sent only (data)
  else{
    role = chattingWithRole;
    data = arg1;
  }

  const list = JSON.parse(data || "{}");

  let title =
    role === "management" ? "Management" : "Students";

  let html = `<h2>💬 Chat with ${title}</h2>`;

  if(Object.keys(list).length === 0){
    html += `<p>No users found</p>`;
  }

  Object.keys(list).forEach(id => {
    const u = list[id];

    const name =
      u.mFullName ||
      u.tFullName ||
      u.traineeFullName ||
      u.name ||
      "Unknown";

    html += `
      <div class="card"
           onclick="openPersonalChat('${id}','${role}')">
        ${name}
      </div>
    `;
  });

  document.getElementById("content").innerHTML = html;
}


function openPersonalChat(id, role){
  chatPartner = id;
  chattingWithRole = role;
  currentView = "personalChatWindow";

  document.getElementById("content").innerHTML = `
    <h3>💬 Chat</h3>
    <div id="chatMessages"
         style="height:300px;overflow:auto;padding:10px;background:white;border-radius:10px;">
    </div>

    <div style="margin-top:10px;display:flex;gap:5px;">
      <input id="chatInput"
             placeholder="Type a message..."
             style="flex:1;padding:8px;border-radius:6px;border:1px solid #bcd4ff;">
      <button onclick="sendPersonalMessage()">➤</button>
    </div>
  `;

  AndroidBridge.getChatMessages(id);
}

function displayChatMessages(data){
  const msgsObj = JSON.parse(data || "{}");
  const box = document.getElementById("chatMessages");
  box.innerHTML = "";

  const msgs = Object.values(msgsObj)
    .sort((a,b)=>(a.timestamp||0)-(b.timestamp||0));

  msgs.forEach(m => {
    const from = (m.from || "").toLowerCase().trim();

    const align = from === myRole ? "right" : "left";
    const bg    = from === myRole ? "#dbe9ff" : "#f1f1f1";

    box.innerHTML += `
      <div style="text-align:${align};margin:6px 0;">
        <span style="display:inline-block;
                     padding:8px 12px;
                     border-radius:12px;
                     background:${bg};
                     max-width:70%;">
          ${m.text}
        </span>
      </div>`;
  });

  box.scrollTop = box.scrollHeight;
}

function sendPersonalMessage(){
  const txt = document.getElementById("chatInput").value.trim();
  if(!txt) return;

  AndroidBridge.sendPersonalMessage(
    chatPartner,
    txt,
    myRole          // 👈 FIXED
  );

  document.getElementById("chatInput").value = "";
  AndroidBridge.getChatMessages(chatPartner);
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
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("menuBtn");
  const sidebar = document.querySelector(".sidebar");
  if(btn && sidebar){
    btn.addEventListener("click",()=> sidebar.classList.toggle("closed"));
  }
});





