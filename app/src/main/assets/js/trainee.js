/* ================= GLOBAL ================= */
let currentView = "home";
let currentGroup = null;

/* ================= HOME ================= */
function showHome() {
    currentView = "home";
    document.getElementById("content").innerHTML = "<h3>Loading Batches...</h3>";

    if (window.AndroidBridge && AndroidBridge.getAllBatches) {
        AndroidBridge.getAllBatches();
    }
}

/* ===== CALLBACK FROM ANDROID ===== */
function showBatchCards(data) {
    let allBatches = [];

    try {
        allBatches = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
        console.error("Batch parse error:", e);
    }

    // IMPORTANT:
    // Do NOT filter using localStorage
    // Firebase controls enrollment
    showFilteredHomeBatches(allBatches);
}

/* ================= HOME UI ================= */
function showFilteredHomeBatches(batches) {
    let html = `<h2>📋 All Batches</h2>`;

    if (!batches || batches.length === 0) {
        html += `<p style="opacity:.6">No available batches</p>`;
        document.getElementById("content").innerHTML = html;
        return;
    }

    batches.forEach(b => {
        html += `
        <div class="card">
            <h3>${b.batchName}</h3>
            <p><b>ID:</b> ${b.batchId}</p>
            <p><b>Subject:</b> ${b.subject}</p>
            <p><b>Time:</b> ${b.time}</p>
            <p><b>Trainer:</b> ${b.trainerId}</p>
          <button onclick="enrollBatch('${encodeURIComponent(JSON.stringify(b))}')">

                👥 Enroll
            </button>
        </div>`;
    });

    document.getElementById("content").innerHTML = html;
}

/* ================= ENROLL ================= */
function enrollBatch(encodedBatch) {
    try {
        const batchObj = JSON.parse(decodeURIComponent(encodedBatch));

        if (window.AndroidBridge && AndroidBridge.enrollBatch) {
            AndroidBridge.enrollBatch(JSON.stringify(batchObj));
        } else {
            alert("AndroidBridge not available");
        }
    } catch (e) {
        console.error("Enroll error:", e);
        alert("Failed to enroll batch");
    }
}


/* ===== CALLBACK AFTER ENROLL ===== */
function onBatchEnrolled() {
    alert("✅ Enrolled successfully");

    // 🔐 Save enrolled batch id locally
    const lastBatch = JSON.parse(
        localStorage.getItem("lastEnrolledBatch")
    );

    if (lastBatch) {
        let enrolled =
            JSON.parse(localStorage.getItem("enrolledBatches") || "[]");

        if (!enrolled.includes(lastBatch.batchId)) {
            enrolled.push(lastBatch.batchId);
            localStorage.setItem("enrolledBatches", JSON.stringify(enrolled));
        }

        localStorage.removeItem("lastEnrolledBatch");
    }

    showHome(); // 🔄 Refresh home
}


/* ================= GROUP CHAT ================= */
function openGroupChat(batchId){
    currentGroup = batchId;

    document.getElementById("content").innerHTML = `
        <h3>📣 Group Chat: ${batchId}</h3>
        <div id="groupBox" class="chat-container"></div>
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
        const css = msg.from === "management"
            ? "message-sent"
            : "message-received";

        box.innerHTML += `
            <div class="message-row">
                <div class="${css}">
                    <b>${msg.from || "Unknown"}</b><br>
                    ${msg.text || ""}
                    <div style="font-size:11px;opacity:.5">
                        ${msg.timestamp ? new Date(msg.timestamp).toLocaleString() : ""}
                    </div>
                </div>
            </div>
        `;
    });

    box.scrollTop = box.scrollHeight;
}

/* ================= PROFILE ================= */
function showProfile() {
    if(currentView === "profile") return;
    currentView = "profile";

    const content = document.getElementById("content");
    content.innerHTML = `<p>Loading profile...</p>`;

    if (window.AndroidBridge) {
        AndroidBridge.getUserProfile("trainee");
    } else {
        alert("AndroidBridge not available");
    }
}

/* ================= PROFILE CALLBACK ================= */
function showProfileDetails(data) {
    if(currentView !== "profile") return;

    try {
        const user = typeof data === "string" ? JSON.parse(data) : data;

        const content = document.getElementById("content");
        content.innerHTML = `
           <div class="profile-container">
               <img
                   src="${user.traineePhoto || 'default-avatar.png'}"
                   loading="lazy"
                   decoding="async"
                   onerror="this.src='default-avatar.png'"
                   style="width:130px;height:130px;border-radius:50%;object-fit:cover;"
               />

                <h3>👤 ${user.traineeName || 'N/A'}</h3>

                <p><b>Username:</b> ${user.traineeUsername || 'N/A'}</p>
                <p><b>Email:</b> ${user.traineeEmail || 'N/A'}</p>
                <p><b>Phone:</b> ${user.traineePhone || 'N/A'}</p>
                <p><b>Gender:</b> ${user.traineeGender || "N/A"}</p>

                <hr>
                <h3>🏠 Temporary Address</h3>
                <p><b>Street:</b> ${user.tempStreet|| 'N/A'}</p>
                <p><b>City:</b> ${user.tempCity|| 'N/A'}</p>
                <p><b>District:</b> ${user.tempDistrict|| 'N/A'}</p>
                <p><b>State:</b> ${user.tempState|| 'N/A'}</p>
                <p><b>Country:</b> ${user.tempCountry|| 'N/A'}</p>

                <hr>
                <h3>🏠 Permanent Address</h3>
                <p><b>Street:</b> ${user.permStreet|| 'N/A'}</p>
                <p><b>City:</b> ${user.permCity|| 'N/A'}</p>
                <p><b>District:</b> ${user.permDistrict|| 'N/A'}</p>
                <p><b>State:</b> ${user.permState|| 'N/A'}</p>
                <p><b>Country:</b> ${user.permCountry || 'N/A'}</p>

                <hr>
                <h3>📘 10th Education</h3>
                <p><b>Year of Passing:</b> ${user.tenthYOP || 'N/A'}</p>
                <p><b>CGPA / Percentage:</b> ${user.tenthPercent || 'N/A'}</p>

                <hr>
                <h3>📙 12th Education</h3>
                <p><b>Year of Passing:</b> ${user.twelfthYOP || 'N/A'}</p>
                <p><b>CGPA / Percentage:</b> ${user.twelfthPercent || 'N/A'}</p>

                <hr>
                <h3>📗 Diploma</h3>
                <p><b>Stream:</b> ${user.diplomaStream || 'N/A'}</p>
                <p><b>Year of Passing:</b> ${user.diplomaYOP || 'N/A'}</p>
                <p><b>CGPA / Percentage:</b> ${user.diplomaCGPA|| 'N/A'}</p>

                <hr>
                <h3>🎓 Undergraduate (UG)</h3>
                <p><b>Degree:</b> ${user.degreeType || 'N/A'}</p>
                <p><b>Stream:</b> ${user.degreeStream|| 'N/A'}</p>
                <p><b>College:</b> ${user.degreeCollege || 'N/A'}</p>
                <p><b>Year of Passing:</b> ${user.degreeYOP || 'N/A'}</p>
                <p><b>CGPA / Percentage:</b> ${user.degreeCGPA || 'N/A'}</p>

                <hr>
                <h3>🎓 Post Graduation (PG)</h3>
                <p><b>Degree:</b> ${user.pgType || 'N/A'}</p>
                <p><b>Specialization:</b> ${user.pgStream || 'N/A'}</p>
                <p><b>College:</b> ${user.pgCollege || 'N/A'}</p>
                <p><b>Year of Passing:</b> ${user.pgYOP || 'N/A'}</p>
                <p><b>CGPA / Percentage:</b> ${user.pgCGPA || 'N/A'}</p>
           </div>
        `;
    } catch(e) {
        console.error("Error parsing profile data:", e);
        alert("Failed to display profile data.");
    }
}

/* ================= MY BATCHES ================= */
function showBatches() {
    currentView = "batches";
    document.getElementById("content").innerHTML = "<p>Loading...</p>";
    AndroidBridge.getEnrolledBatches();
}

function showBatchesFromFirebase(batches) {
    if (!batches || batches.length === 0) {
        document.getElementById("content").innerHTML = `
            <div class="card">
                <h3>📚 My Batches</h3>
                <p style="opacity:.6">No enrolled batch</p>
            </div>`;
        return;
    }

    let html = `<h2>📚 My Batches</h2>`;
    batches.forEach(b => {
        html += `
            <div class="card">
                <h3>${b.batchName}</h3>
                <p><b>Subject:</b> ${b.subject}</p>
                <p><b>Time:</b> ${b.time}</p>
                <button onclick="openGroupChat('${b.batchId}')">💬 Group Chat</button>
            </div>`;
    });

    document.getElementById("content").innerHTML = html;
}
/* ================= MESSAGES ================= */
function showMessages() {
    currentView = "messages";
    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>💬 Messages</h3>
            <p>Trainer: Complete assignment</p>
        </div>
    `;
}

/* ================= REQUIREMENTS ================= */
function showRequirements() {
    currentView = "requirements";
    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>🧾 Requirements</h3>
            <ul>
                <li>Placement</li>
                <li>Mock Interview</li>
            </ul>
        </div>
    `;
}
function showRequirements(){
    const uid = localStorage.getItem("uuid");

    if(AndroidBridge.getStudentRequirements){
        AndroidBridge.getStudentRequirements(uid);
    }
}

function displayRequirements(data){
    const req = JSON.parse(data);
    let html = `<h2>📌 Requirements</h2>`;
    Object.keys(req).forEach(id=>{
        html += `<div class="card">
            <p>${req[id].text}</p>
            <small>From: ${req[id].from}</small>
        </div>`;
    });
    document.getElementById("content").innerHTML = html;
}

/* ================= RESUME ================= */
function showResume() {
    currentView = "resume";
    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>📄 Resume Analyse</h3>
            <input type="file">
        </div>
    `;
}


/* ================= LOGOUT ================= */
function logout(){
    if(confirm("⚠️ Are you sure you want to logout?")){
        localStorage.clear();
        location.href = "index1.html";
    }
}
