/* ========= 🌍 GLOBAL VARIABLES ========= */
let currentView = "home";
let currentBatch = "";
let chatPartner = "";

/* ========= 🏠 HOME ========= */
function showHome(){
  document.getElementById("content").innerHTML = "<h3>Loading...</h3>";
  AndroidBridge.getAssignedBatches();
}


function showAssignedBatches(data){
    const list = JSON.parse(data || "{}");
    let html = `<h2>📌 Assigned Batches</h2>`;

    Object.keys(list).length === 0 ?
        html += `<p>No batches assigned yet.</p>` :
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

        const profilePic = user.tProfilePic_Base64
            ? `data:image/png;base64,${user.tProfilePic_Base64}`
            : "default-avatar.png";

        document.getElementById("content").innerHTML = `
            <div class="card profileCard">
                <div style="text-align:center;">
                    <img src="${profilePic}" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:2px solid #0057d9;">
                    <h2>👤 ${user.tFullName || 'N/A'}</h2>
                </div>

                <hr>
                <h3>📌 Basic Information</h3>
                <p><b>Username:</b> ${user.tUsername || 'N/A'}</p>
                <p><b>Email:</b> ${user.tEmail || 'N/A'}</p>
                <p><b>Mobile:</b> ${user.tMobile || 'N/A'}</p>
                <p><b>DOB:</b> ${user.tDob || 'N/A'}</p>
                <p><b>Gender:</b> ${user.tGender || 'N/A'}</p>
                <p><b>Address:</b> ${user.tStreet || ''}, ${user.tCity || ''}, ${user.tState || ''}</p>

                <hr>
                <h3>🎓 Education</h3>
                <p><b>UG:</b> ${user.ugDegree || 'N/A'} - ${user.ugStream || ''} (${user.ugYOP || ''})</p>
                <p><b>PG:</b> ${user.pgDegree || 'N/A'} - ${user.pgSpec || ''} (${user.pgYOP || ''})</p>

                <hr>
                <h3>💼 Work Details</h3>
                <p><b>Experience:</b> ${user.tExperience || 'N/A'}</p>
                <p><b>LinkedIn:</b> <a href="${user.tLinkedIn || '#'}" target="_blank">${user.tLinkedIn || 'N/A'}</a></p>

                <hr>
                <h3>🏦 Bank Details</h3>
                <p><b>Account Holder:</b> ${user.accHolder || 'N/A'}</p>
                <p><b>Account Number:</b> ${user.accNumber || 'N/A'}</p>
                <p><b>IFSC:</b> ${user.ifsc || 'N/A'}</p>
                <p><b>Bank:</b> ${user.bankName || 'N/A'} (${user.branchName || 'N/A'})</p>
                <p><b>PAN:</b> ${user.pan || 'N/A'}</p>
                <p><b>Aadhar:</b> ${user.aadhar || 'N/A'}</p>
            </div>
        `;
    }
    catch(e){
        console.error("Profile Parse Error:", e);
        alert("❌ Failed to load trainer profile");
    }
}


/* ========= 💬 GROUP CHAT ========= */
function openGroupChat(batchId){
    if(!batchId){ alert("❌ Invalid Batch ID"); return; }
    currentBatch = batchId;

    if(AndroidBridge.getGroupMessages){
        AndroidBridge.getGroupMessages(batchId);
    }

    document.getElementById("content").innerHTML = `
        <h2>📢 Group Chat - ${batchId}</h2>
        <div id="chatBox" style="height:300px;overflow:auto;background:white;padding:10px;margin-bottom:10px;border-radius:8px;"></div>
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
    const text = document.getElementById("msgInput").value.trim();
    if(!text) return;
    AndroidBridge.sendGroupMessage(currentBatch, text, "trainer");
    AndroidBridge.getGroupMessages(currentBatch);
    document.getElementById("msgInput").value = "";
}

/* ========= 👥 PERSONAL CHAT ========= */
function showPersonalChat(){
    currentView = "personalChat";
    document.getElementById("content").innerHTML = `
        <h2>📱 Personal Chat</h2>
        <button onclick="loadManagement()">Chat with Management</button> <br><br>
        <button onclick="loadStudents()">Chat with Students</button>
    `;
}
function loadManagement(){
    currentView = "personalChat";
    if(AndroidBridge.getManagementUsers){
        AndroidBridge.getManagementUsers();        // preferred if exists
    }
    else if(AndroidBridge.getAllTrainersForChat){
        AndroidBridge.getAllTrainersForChat();     // fallback
    }
}


function loadTrainerList(data){
    const trainers = JSON.parse(data || "{}");
    let html = `<h3>👨‍💼 Management / Trainers</h3>`;
    Object.keys(trainers).forEach(id=>{
        html += `<div class="card" onclick="startChat('${id}')">💠 ${trainers[id].tFullName}</div>`;
    });
    document.getElementById("content").innerHTML = html;
}

function loadStudents(){
    if(AndroidBridge.getAllStudents){
        AndroidBridge.getAllStudents();
    }
}

function displayStudents(data){
    const list = JSON.parse(data || "{}");
    let html = `<h3>🎓 Students</h3>`;
    Object.keys(list).forEach(id=>{
        html += `<div class="card" onclick="startChat('${id}')">👤 ${list[id].traineeName}</div>`;
    });
    document.getElementById("content").innerHTML = html;
}

/* ====== START CHAT ====== */
function startChat(id){
    if(!id){ alert("⚠️ Error: Invalid User"); return; }
    chatPartner = id;

    if(AndroidBridge.getChatHistory){
        AndroidBridge.getChatHistory(id);
    }

    document.getElementById("content").innerHTML = `
        <h3>💬 Chat</h3>
        <div id="chatWindow" style="height:300px;overflow:auto;background:white;border-radius:10px;padding:10px;"></div>
        <input id="pmsg" placeholder="Message...">
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
    let text = document.getElementById("pmsg").value.trim();
    if(!text) return;
    AndroidBridge.sendPersonalMessage(chatPartner, text, "trainer");
    AndroidBridge.getChatHistory(chatPartner);
    document.getElementById("pmsg").value = "";
}

/* ========= 📌 REQUIREMENT ========= */
function showAddRequirement(){
  currentView="req";
  AndroidBridge.getAllStudents();
  document.getElementById("content").innerHTML = `
    <h3>📌 Send Requirement</h3>
    <select id="stuList"></select>
    <textarea id="reqText"></textarea>
    <button onclick="sendReq()">Send</button>`;
}
/* ========= STUDENT LIST FOR PERSONAL CHAT ========= */
function displayStudents(data){
    if(currentView === "personalChat"){
        const list = JSON.parse(data || "{}");
        let html = `<h3>🎓 Students</h3>`;
        Object.keys(list).forEach(id=>{
            html += `<div class="card" onclick="startChat('${id}')">👤 ${list[id].traineeFullName}</div>`;
        });
        document.getElementById("content").innerHTML = html;
        return;
    }

    /* ========= STUDENT LIST FOR REQUIREMENT ========= */
    if(currentView === "req"){
        const list = JSON.parse(data || "{}");
        let dropdown = document.getElementById("stuList");
        dropdown.innerHTML = "";
        Object.keys(list).forEach(id=>{
            dropdown.innerHTML += `<option value="${id}">${list[id].traineeFullName}</option>`;
        });
        return;
    }
}



function sendReq(){
    const id = document.getElementById("stuList").value;
    const text = document.getElementById("reqText").value;
    if(!text) return alert("⚠️ Enter text!");
    AndroidBridge.addRequirement(id, text, "trainer");
    alert("✔️ Requirement Sent");
}

/* ========= 🚪 LOGOUT ========= */
function logout(){ location.href = "index1.html"; }

/* ========= ✔️ AUTO SIDEBAR TOGGLE ========= */
document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("menuBtn");
    const sidebar = document.querySelector(".sidebar");
    if(btn && sidebar){
        btn.addEventListener("click",()=> sidebar.classList.toggle("closed"));
    }
});
