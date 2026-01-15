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
            <button onclick="showEnrolledStudents('${b.batchId}', '${b.batchName}')">👥 Enrolled Students</button>
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
function showEnrolledStudents(batchId, batchName){
    currentView = "enrolledStudents";
    document.getElementById("content").innerHTML = `<h3>Loading students for ${batchName}...</h3>`;

    // Fetch students from AndroidBridge
    if(AndroidBridge.getStudentsByBatch){
        AndroidBridge.getStudentsByBatch(batchId);
    } else {
        alert("AndroidBridge.getStudentsByBatch() not implemented!");
    }
}

function displayEnrolledStudents(data){
    const students = JSON.parse(data || "{}");

    let html = `<h2>👥 Enrolled Students</h2>`;
    if(Object.keys(students).length === 0){
        html += `<p>No students enrolled yet.</p>`;
    } else {
        Object.keys(students).forEach(id=>{
            const s = students[id];
            const name = s.traineeFullName || s.traineeName || "Unknown Student";

            html += `
            <div class="card">
                <h3>${name}</h3>
                <p>${s.traineeEmail || ''}</p>
                <button onclick="openPersonalChat('${id}','student')">💬 Chat</button>
            </div>`;
        });
    }

    html += `<button onclick="showHome()">⬅️ Back to Batches</button>`;
    document.getElementById("content").innerHTML = html;
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

/* ================= Trainer DISPLAY ================= */
function showTrainers(){
    document.getElementById("content").innerHTML = `<h3>Loading Trainers...</h3>`;
    AndroidBridge.getAllTrainersForManagement();
}

function displayTrainerCards(data){
    const trainers = JSON.parse(data);
    let html = `<h2>👨‍🏫 All Trainers</h2>`;

    Object.keys(trainers).forEach(id=>{
        const t = trainers[id];
        html += `
        <div class="card">
            <h3>${t.tFullName || 'N/A'}</h3>
            <p>${t.tEmail || 'N/A'}</p>

            <button onclick="viewTrainer('${id}')">👁 View Profile</button>
        </div>`;
    });

    document.getElementById("content").innerHTML = html;
}
function viewTrainer(id){
    AndroidBridge.getSpecificTrainer(id);           // existing
    AndroidBridge.getTrainerAssignedBatches(id);   // existing
}
function displayTrainerProfile(data){
    const user = JSON.parse(data);   // ✅ correct variable
    const content = document.getElementById("content");

    content.innerHTML = `
      <div class="profile-container">

       <img
         src="${getSafeImage(user.tProfilePic_Base64)}"
         loading="lazy"
         decoding="async"
         style="width:130px;height:130px;border-radius:50%;object-fit:cover;"
       />

        <h3>👨‍🏫 ${user.tFullName || 'N/A'}</h3>

        <p><b>Username:</b> ${user.tUsername || 'N/A'}</p>
        <p><b>Email:</b> ${user.tEmail || 'N/A'}</p>
        <p><b>Mobile:</b> ${user.tMobile || 'N/A'}</p>
        <p><b>Experience:</b> ${user.tExperience || 'N/A'}</p>

        <p><b>LinkedIn:</b>
            ${user.tLinkedIn
                ? `<a href="${user.tLinkedIn}" target="_blank">Open Profile</a>`
                : 'N/A'}
        </p>

        <hr>
        <h3>🏠 Address</h3>
        <p>${user.tStreet || ''}, ${user.tCity || ''}</p>
        <p>${user.tDist || ''}, ${user.tState || ''}</p>
        <p>${user.tCountry || ''}</p>

        <hr>
        <h3>🎓 Education</h3>
        <p><b>UG:</b> ${user.ugDegree || 'N/A'} (${user.ugStream || ''})</p>
        <p><b>PG:</b> ${user.pgDegree || 'N/A'} (${user.pgSpec || ''})</p>

        <button onclick="assignBatchToTrainer('${user.uuid}')">
            ➕ Assign Batch
        </button>

        <hr>
        <h3>📚 Assigned Batches</h3>
        <div id="assignedBatchBox">
            <p>Loading...</p>
        </div>

      </div>
    `;
}
function assignBatchToTrainer(trainerId){
    showAddBatch();

    setTimeout(()=>{
        const select = document.getElementById("trainerSelect");
        if(select){
            select.value = trainerId;
        }
    }, 300);
}
function showTrainerAssignedBatches(data){
    const batches = JSON.parse(data || "{}");
    const box = document.getElementById("assignedBatchBox");

    if(!box) return;

    if(Object.keys(batches).length === 0){
        box.innerHTML = `<p>No batch assigned yet.</p>`;
        return;
    }

    let html = `<ul>`;
    Object.keys(batches).forEach(batchId=>{
        html += `<li>📘 ${batchId}</li>`;
    });
    html += `</ul>`;

    box.innerHTML = html;
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
            const name =
                list[id].traineeFullName ||
                list[id].traineeName ||
                "Unknown Student";

            dd.innerHTML += `<option value="${id}">${name}</option>`;

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

function showStudentFullProfile(data){
     const user = JSON.parse(data); // ✅ FIX

     const content = document.getElementById("content");
     content.innerHTML = `
        <div class="profile-container">

            <img
              src="${getSafeImage(user.traineePhoto)}"
              loading="lazy"
              decoding="async"
              style="width:130px;height:130px;border-radius:50%;object-fit:cover;"
            />


            <h3>👤 ${user.traineeName || 'N/A'}</h3>

            <p><b>Username:</b> ${user.traineeUsername || 'N/A'}</p>
            <p><b>Email:</b> ${user.traineeEmail || 'N/A'}</p>
            <p><b>Phone:</b> ${user.traineePhone || 'N/A'}</p>

            <hr>
            <h3>🏠 Temporary Address</h3>
            <p>${user.tempStreet || 'N/A'}, ${user.tempCity || ''}</p>
            <p>${user.tempDistrict || ''}, ${user.tempState || ''}</p>
            <p>${user.tempCountry || ''}</p>

            <hr>
            <h3>🏠 Permanent Address</h3>
            <p>${user.permStreet || 'N/A'}, ${user.permCity || ''}</p>
            <p>${user.permDistrict || ''}, ${user.permState || ''}</p>
            <p>${user.permCountry || ''}</p>

            <hr>
            <h3>📘 10th</h3>
            <p>YOP: ${user.tenthYOP || 'N/A'}</p>
            <p>Marks: ${user.tenthPercent || 'N/A'}</p>

            <hr>
            <h3>📙 12th</h3>
            <p>YOP: ${user.twelfthYOP || 'N/A'}</p>
            <p>Marks: ${user.twelfthPercent || 'N/A'}</p>

            <hr>
            <h3>🎓 UG</h3>
            <p>${user.degreeType || ''} - ${user.degreeStream || ''}</p>
            <p>${user.degreeCollege || ''}</p>
            <p>YOP: ${user.degreeYOP || ''}</p>
            <p>CGPA: ${user.degreeCGPA || ''}</p>

            <hr>
            <h3>🎓 PG</h3>
            <p>${user.pgType || 'N/A'} - ${user.pgStream || ''}</p>
            <p>${user.pgCollege || ''}</p>
            <p>YOP: ${user.pgYOP || ''}</p>
            <p>CGPA: ${user.pgCGPA || ''}</p>

        </div>
     `;
 }

function getSafeImage(img){
    if(!img || img === "{}") return "default-avatar.png";

    // Base64 image
    if(img.startsWith("data:image")) return img;

    // Invalid stored JSON → fallback
    return "default-avatar.png";
}


/* ================= ADD REQUIREMENT ================= */
function showAddRequirement() {
    document.getElementById("content").innerHTML = `
        <h2>📌 Add Requirement</h2>

        <div class="card requirement-card">

            <label>👨‍🎓 Select Student</label>
          <select id="reqStudent"></select>

            <label>🏢 Company Name</label>
            <input type="text" id="reqCompany" placeholder="Company Name">

            <label>💼 Role</label>
            <input type="text" id="reqRole" placeholder="Job Role">

            <label>📅 Date</label>
            <input type="date" id="reqDate">

            <label>⏰ Time</label>
            <input type="time" id="reqTime">

            <label>📝 Description</label>
            <textarea id="reqDesc" rows="4" placeholder="Requirement details"></textarea>

            <button onclick="submitRequirement()">➕ Add Requirement</button>

        </div>
    `;

    AndroidBridge.getAllStudentsForRequirement(); // existing
}


function submitRequirement() {
    const studentId = document.getElementById("reqStudent").value;
    const company = document.getElementById("reqCompany").value;
    const role = document.getElementById("reqRole").value;
    const date = document.getElementById("reqDate").value;
    const time = document.getElementById("reqTime").value;
    const desc = document.getElementById("reqDesc").value;

    if (!studentId || !company || !role) {
        alert("Please fill required fields");
        return;
    }

    const obj = {
        company,
        role,
        date,
        time,
        description: desc,
        from: "management",
        timestamp: Date.now()
    };

    AndroidBridge.addRequirement(
        studentId,
        JSON.stringify(obj)
    );
}
function onRequirementAdded(){
    alert("✅ Requirement added successfully!");

    // Optional: clear form
    document.getElementById("reqCompany").value = "";
    document.getElementById("reqRole").value = "";
    document.getElementById("reqDate").value = "";
    document.getElementById("reqTime").value = "";
    document.getElementById("reqDesc").value = "";
    document.getElementById("reqStudent").value = "";
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

    // 🔁 Try both directions
    loadPersonalChat(id);
}
function loadPersonalChat(otherId){
    const myId = localStorage.getItem("uuid");

    // First try management → trainee
    AndroidBridge.getChatMessages(otherId);

    // Fallback handler
    window.displayChatMessages = function(data){
        let msgs = JSON.parse(data || "[]");

        if(!msgs || msgs.length === 0){
            // Try reverse direction
            AndroidBridge.getChatMessagesReverse(otherId);
            return;
        }

        renderPersonalMessages(msgs);
    };
}
function renderPersonalMessages(msgs){
    let box = document.getElementById("chatMessages");
    box.innerHTML = "";

    msgs.forEach(m=>{
        let cls = m.sender === "management"
            ? "message-sent"
            : "message-received";

        box.innerHTML += `
          <div class="message-row">
            <div class="${cls}">
              ${m.text}
            </div>
          </div>
        `;
    });

    box.scrollTop = box.scrollHeight;
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
    chatInput.value = "";

    // Refresh
    loadPersonalChat(uid);
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
    const msgs = typeof data === "string" ? JSON.parse(data) : data;
    const box = document.getElementById("groupBox");
    box.innerHTML = "";

    if(!msgs || Object.keys(msgs).length === 0){
        box.innerHTML = "<p style='opacity:.5'>No messages yet</p>";
        return;
    }

    Object.keys(msgs).forEach(key=>{
        const msg = msgs[key];

        const sender = msg.from || "Unknown";
        const text   = msg.text || "";
        const time   = msg.timestamp
            ? new Date(msg.timestamp).toLocaleString()
            : "";

        const css = sender === "management"
            ? "message-sent"
            : "message-received";

        box.innerHTML += `
            <div class="message-row">
                <div class="${css}">
                    <b>${sender}</b><br>
                    ${text}
                    <div style="font-size:11px;opacity:.5">${time}</div>
                </div>
            </div>
        `;
    });

    box.scrollTop = box.scrollHeight;
}




function sendGroupMessage(){
     let text = document.getElementById("groupInput").value.trim();

     if(text === ""){
         alert("⚠️ Please type something!");
         return;
     }

     // SEND to Firebase via AndroidBridge
     if(AndroidBridge && AndroidBridge.sendGroupMessage){
         AndroidBridge.sendGroupMessage(currentGroup, text, "management");
     } else {
         console.error("❌ sendGroupMessage NOT FOUND in AndroidBridge");
         alert("AndroidBridge Error! Check your Java function name.");
         return;
     }

     // CLEAR input
     document.getElementById("groupInput").value = "";

     // REFRESH messages
     setTimeout(()=>{
         if(AndroidBridge.getGroupMessages){
             AndroidBridge.getGroupMessages(currentGroup);
         }
     }, 300);
 }



/* ================= Logout ================= */
function logout(){
    const confirmLogout = confirm("⚠️ Are you sure you want to logout?");

    if(confirmLogout){
        // Optional: clear session data
        localStorage.clear();

        location.href = "index1.html";
    }
    // else → do nothing
}


/* ================= SIDEBAR TOGGLE ================= */
document.addEventListener("DOMContentLoaded", ()=>{
    menuBtn.addEventListener("click",()=> sidebar.classList.toggle("closed"));
});
