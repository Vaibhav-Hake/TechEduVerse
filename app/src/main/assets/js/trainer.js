/* ========= 🌍 GLOBAL VARIABLES ========= */
let currentView = "home";
let currentBatch = "";
let chatPartner = "";

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

  if(AndroidBridge.getGroupMessages){
      AndroidBridge.getGroupMessages(batchId);
  } else if(AndroidBridge.getBatchMessages){
      AndroidBridge.getBatchMessages(batchId); // fallback
  } else {
      return alert("❌ No chat API found in Android");
  }

  document.getElementById("content").innerHTML = `
    <h2>📢 Group Chat - ${batchId}</h2>
    <div id="chatBox" class="chatArea" style="height:300px;overflow:auto;padding:10px;background:white;"></div>
    <input id="msgInput" placeholder="Type message...">
    <button onclick="sendGroupMsg()">Send</button>
  `;
}


function loadGroupMessages(data){
  const msgs = JSON.parse(data || "{}");
  let box = document.getElementById("chatBox");
  box.innerHTML = "";

  Object.keys(msgs).forEach(k=>{
    let m = msgs[k];
    box.innerHTML += `<p><b>${m.from}:</b> ${m.text}</p>`;
  });

  box.scrollTop = box.scrollHeight;
}
function sendGroupMsg(){
   let text = document.getElementById("msgInput").value;
   if(text.trim() == "") return;

   AndroidBridge.sendGroupMessage(currentBatch, text, "trainer");
   AndroidBridge.getGroupMessages(currentBatch);
}



/* ========= 👥 PERSONAL CHAT ========= */
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
  currentView = "personalChat";

  if(AndroidBridge.getManagementUsers){
      AndroidBridge.getManagementUsers();
  } else if(AndroidBridge.getAllTrainersForChat){
      AndroidBridge.getAllTrainersForChat();
  } else {
      alert("❌ No Management API found in Android");
  }
}


// MANAGEMENT/TRAINERS LIST
function loadTrainerList(data){
  const trainers = JSON.parse(data || "{}");
  let html = `<h3>👨‍💼 Management / Trainers</h3>`;

  Object.keys(trainers).forEach(id=>{
    const name = trainers[id].mFullName || trainers[id].tFullName || "Unknown";
    html += `<div class="card" onclick="startChat('${id}')">${name}</div>`;
  });

  document.getElementById("content").innerHTML = html;
  if(typeof AndroidBridge !== "undefined"){
    AndroidBridge.loadTrainerList = loadTrainerList; // ensure mapping
    AndroidBridge.displayStudents = displayStudents; // ensure mapping
  }

}

// STUDENTS LIST
function loadStudents(){
  currentView = "personalChat";
  AndroidBridge.getAllStudents();
}

/* ========= SINGLE FUNCTION FOR STUDENT DATA ========= */
function displayStudents(data){
  const list = JSON.parse(data || "{}");

  if(currentView === "personalChat"){
    let html = `<h3>🎓 Students</h3>`;
    Object.keys(list).forEach(id=>{
      html += `<div class="card" onclick="startChat('${id}')">${list[id].traineeFullName}</div>`;
    });
    return document.getElementById("content").innerHTML = html;
  }

  if(currentView === "req"){
    let dd = document.getElementById("stuList");
    dd.innerHTML = "";
    Object.keys(list).forEach(id=>{
      dd.innerHTML += `<option value="${id}">${list[id].traineeFullName}</option>`;
    });
  }
}


/* ========= CHAT WINDOW ========= */
function startChat(id){
  if(!id){ return alert("⚠️ Invalid User"); }

  chatPartner = id;
  currentView = "chat";

  if(AndroidBridge.getChatHistory){
      AndroidBridge.getChatHistory(id);
  } else {
      return alert("❌ Chat History API Missing");
  }

  document.getElementById("content").innerHTML = `
      <h2>💬 Chat with ${id}</h2>
      <div id="chatWindow" style="height:300px;overflow:auto;background:white;padding:10px;border-radius:10px;"></div>
      <input id="pmsg">
      <button onclick="sendPmsg()">Send</button>
  `;
}


function showChatMessages(data){
  const msgs = JSON.parse(data || "{}");
  let box = document.getElementById("chatWindow");
  box.innerHTML = "";

  Object.keys(msgs).forEach(k=>{
    let m = msgs[k];
    box.innerHTML += `<p><b>${m.from}:</b> ${m.text}</p>`;
  });

  box.scrollTop = box.scrollHeight;
}

function sendPmsg(){
  let msg = document.getElementById("pmsg").value.trim();
  if(!msg) return;
  AndroidBridge.sendPersonalMessage(chatPartner, msg, "trainer");
  AndroidBridge.getChatHistory(chatPartner);
  document.getElementById("pmsg").value = "";
}


/* ========= 📌 REQUIREMENT ========= */
function showAddRequirement(){
  currentView = "req";
  AndroidBridge.getAllStudents();
  document.getElementById("content").innerHTML = `
    <h3>📌 Send Requirement</h3>
    <select id="stuList"></select>
    <textarea id="reqText"></textarea>
    <button onclick="sendReq()">Send</button>
  `;
}

function sendReq(){
  const id = document.getElementById("stuList").value;
  const text = document.getElementById("reqText").value;
  if(!text){ return alert("⚠️ Enter requirement!"); }
  AndroidBridge.addRequirement(id, text, "trainer");
  alert("✔️ Requirement Sent");
}


/* ========= 🚪 LOGOUT ========= */
function logout(){ location.href = "index1.html"; }


/* ========= SIDEBAR TOGGLE ========= */
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("menuBtn");
  const sidebar = document.querySelector(".sidebar");
  if(btn && sidebar){
    btn.addEventListener("click",()=> sidebar.classList.toggle("closed"));
  }
});
