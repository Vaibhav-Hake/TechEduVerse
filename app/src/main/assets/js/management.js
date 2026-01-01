/* ================= GLOBAL ================= */
let currentView = "home";
let currentChatUser = null;
let currentChatRole = null;
let currentGroup = null;

/* ================= HOME ================= */
function showHome(){
    currentView = "home";
    document.getElementById("content").innerHTML = "<h3>Loading Batches...</h3>";

    if(AndroidBridge.getAllBatches){
        AndroidBridge.getAllBatches();
    }
}

function showBatchCards(data){
    const batches = JSON.parse(data);
    let html = `<h2>📋 All Batches</h2>`;

    batches.forEach(b=>{
        html += `
        <div class="card">
            <h3>${b.batchName}</h3>
            <p><b>ID:</b> ${b.batchId}</p>
            <p><b>Subject:</b> ${b.subject}</p>
            <p><b>Time:</b> ${b.time}</p>
            <p><b>Trainer:</b> ${b.trainerId}</p>

            <button onclick="openGroupChat('${b.batchId}')">💬 Group Chat</button>
            <button onclick="removeBatch('${b.batchId}')">🗑️ Delete</button>
        </div>`;
    });

    document.getElementById("content").innerHTML = html;
}

function removeBatch(id){
    if(confirm("Delete this batch?")){
        AndroidBridge.deleteBatch(id);
        showHome();
    }
}

/* ================= PROFILE ================= */
function showProfile(){
    currentView = "profile";
    document.getElementById("content").innerHTML = `<p>Loading Profile...</p>`;
    AndroidBridge.getUserProfile("management");
}

function showProfileDetails(data){
    let user = JSON.parse(data);
    document.getElementById("content").innerHTML = `
        <div class="profile-container">
            <h3>👤 ${user.mFullName}</h3>
            <p><b>Username:</b> ${user.mUsername}</p>
            <p><b>Email:</b> ${user.mEmail}</p>
            <p><b>Mobile:</b> ${user.mMobile}</p>
            <p><b>Role:</b> Management</p>
        </div>
    `;
}

/* ================= ADD BATCH ================= */
function showAddBatch(){
    currentView = "addBatch";

    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>➕ Add Batch</h3>

            <label>Batch Name:</label>
            <input id="batchName" />

            <label>Subject:</label>
            <input id="subjectName" />

            <label>Time:</label>
            <input type="time" id="batchTime"/>

            <label>Assign Trainer:</label>
            <select id="trainerSelect"></select>

            <button onclick="saveBatch()">Save</button>
        </div>
    `;

    AndroidBridge.getAllTrainers();
}

function receiveTrainers(data){
    const trainers = JSON.parse(data);
    let drop = document.getElementById("trainerSelect");
    drop.innerHTML = `<option value="">Select Trainer</option>`;

    Object.keys(trainers).forEach(id=>{
        drop.innerHTML += `<option value="${id}">${trainers[id].tFullName}</option>`;
    });
}

function saveBatch(){
    const id = "BATCH_" + Date.now();
    let batch = {
        batchName: batchName.value.trim(),
        subject: subjectName.value.trim(),
        time: batchTime.value.trim(),
        trainerId: trainerSelect.value.trim()
    };

    if(Object.values(batch).includes("")){
        alert("Fill all fields");
        return;
    }

    AndroidBridge.addBatch(id, JSON.stringify(batch));
    alert("Batch Added!");
    showHome();
}

/* ================= STUDENTS DISPLAY ================= */
function showStudents(){
    document.getElementById("content").innerHTML = `<h3>Loading Students...</h3>`;
    AndroidBridge.getAllStudents();
}

function displayStudents(data){
    const list = JSON.parse(data);

    if(document.getElementById("reqStudent")) {
        let dd = document.getElementById("reqStudent");
        dd.innerHTML = `<option value="">Select Student</option>`;
        Object.keys(list).forEach(id=>{
            dd.innerHTML += `<option value="${id}">${list[id].traineeFullName}</option>`;
        });
        return;
    }

    let html = `<h2>🎓 All Students</h2>`;
    Object.keys(list).forEach(id=>{
        let s = list[id];
        html += `
        <div class="card">
            <h3>${s.traineeFullName}</h3>
            <p>${s.traineeEmail}</p>
            <button onclick="viewStudent('${id}')">View Profile</button>
        </div>`;
    });

    content.innerHTML = html;
}

function viewStudent(id){
    AndroidBridge.getSpecificStudent(id);
}

function displaySingleStudent(data){
    const s = JSON.parse(data);
    document.getElementById("content").innerHTML = `
        <div class="profile-container">
            <h3>${s.traineeFullName}</h3>
            <p>${s.traineeEmail}</p>
            <p>${s.traineePhone}</p>
        </div>
    `;
}

/* ================= ADD REQUIREMENT ================= */
function showAddRequirement(){
    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>📌 Add Requirement</h3>
            <select id="reqStudent"></select>
            <textarea id="reqText"></textarea>
            <button onclick="submitRequirement()">Submit</button>
        </div>`;

    AndroidBridge.getAllStudents();
}

function submitRequirement(){
    let id = reqStudent.value;
    let text = reqText.value.trim();
    if(id==="" || text==="") return alert("Fill all");

    AndroidBridge.addRequirement(id, text, "management");
    alert("Sent!");
}

/* ================= PERSONAL CHAT ================= */
function openChatList(role){
    currentView = "chatList";
    document.getElementById("content").innerHTML = `<h3>Loading list...</h3>`;
    AndroidBridge.getUsersByRole(role);
}

function displayChatList(role, data){
    const list = JSON.parse(data);
    let html = `<h2>💬 Chat with ${role}s</h2>`;

    Object.keys(list).forEach(id=>{
        let u=list[id];
        html += `
        <div class="card" onclick="openPersonalChat('${id}','${role}')">
            ${u.name} <br> <small>${u.email}</small>
        </div>`;
    });

    content.innerHTML = html;
}

function openPersonalChat(id, role){
    currentChatUser = id;
    currentChatRole = role;

    document.getElementById("content").innerHTML = `
        <h3>💬 Chat with ${role.toUpperCase()}</h3>

        <div id="chatMessages" class="chat-container"></div>

        <div class="chat-input-area">
          <input id="chatInput" placeholder="Type a message..."/>
          <button onclick="sendPersonalMessage('${id}')">➤</button>
        </div>
    `;

    AndroidBridge.getChatMessages(id);
}


function displayChatMessages(data) {
    let msgs = JSON.parse(data);
    let box = document.getElementById("chatMessages");
    box.innerHTML = "";

    msgs.forEach(m => {
        let classname = m.sender === "management" ? "message-sent" : "message-received";
        box.innerHTML += `
           <div class="message-row"><div class="${classname}">${m.text}</div></div>
        `;
    });

    box.scrollTop = box.scrollHeight;
}


function sendPersonalMessage(uid){
    let txt = chatInput.value.trim();
    if(txt==="") return;
    AndroidBridge.sendPersonalMessage(uid, txt);
    chatInput.value="";
    AndroidBridge.getChatMessages(uid);
}

/* ================= GROUP CHAT ================= */
function openGroupChat(batchId){
    currentGroup = batchId;

    document.getElementById("content").innerHTML = `
        <h3>📣 Group Chat: ${batchId}</h3>

        <div id="groupBox" class="chat-container"></div>

        <div class="chat-input-area">
          <input id="groupInput" placeholder="Write message..."/>
          <button onclick="sendGroupMessage()">➤</button>
        </div>
    `;

    AndroidBridge.getGroupMessages(batchId);
}

function loadGroupMessages(data){
    let msgs = JSON.parse(data);
    let box = document.getElementById("groupBox");
    box.innerHTML = "";

    msgs.forEach(msg=>{
        let owner = msg.from === "management" ? "message-sent" : "message-received";
        box.innerHTML += `
          <div class="message-row"><div class="${owner}">${msg.text}</div></div>
        `;
    });

    box.scrollTop = box.scrollHeight;
}

function sendGroupMessage(){
    let txt = groupInput.value.trim();
    if(txt==="") return;
    AndroidBridge.sendGroupMessage(currentGroup, txt);
    groupInput.value="";
    AndroidBridge.getGroupMessages(currentGroup);
}

/* ================= Logout ================= */
function logout(){
    location.href = "index1.html";
}

/* ================= SIDEBAR TOGGLE ================= */
document.addEventListener("DOMContentLoaded", ()=>{
    menuBtn.addEventListener("click",()=> sidebar.classList.toggle("closed"));
});
