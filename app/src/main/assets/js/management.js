/* ================= GLOBAL ================= */
let currentView = "home";
let currentChatUser = null;
let currentChatRole = null;
let currentGroup = null;

/* ===== BACK BUTTON SUPPORT ===== */
function getCurrentView(){
    return currentView || "home";
}

/* ================= HOME ================= */
function showHome(){
    currentView = "home";
    AndroidBridge.updateCurrentView("home");

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
    AndroidBridge.updateCurrentView("profile");

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
    AndroidBridge.updateCurrentView("addBatch");

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

/* ================= TRAINERS ================= */
function showTrainers(){
    currentView = "trainers";
    AndroidBridge.updateCurrentView("trainers");

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

    content.innerHTML = html;
}

function viewTrainer(id){
    currentView = "trainerProfile";
    AndroidBridge.updateCurrentView("trainerProfile");

    AndroidBridge.getSpecificTrainer(id);
    AndroidBridge.getTrainerAssignedBatches(id);
}

/* ================= STUDENTS ================= */
function showStudents(){
    currentView = "students";
    AndroidBridge.updateCurrentView("students");

    document.getElementById("content").innerHTML = `<h3>Loading Students...</h3>`;
    AndroidBridge.getAllStudents();
}

function displayStudents(data){
    const list = JSON.parse(data);

    if(document.getElementById("reqStudent")){
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
    currentView = "studentProfile";
    AndroidBridge.updateCurrentView("studentProfile");

    AndroidBridge.getSpecificStudent(id);
}

/* ================= ADD REQUIREMENT ================= */
function showAddRequirement(){
    currentView = "addRequirement";
    AndroidBridge.updateCurrentView("addRequirement");

    document.getElementById("content").innerHTML = `
        <h2>📌 Add Requirement</h2>

        <div class="card">
            <label>Select Student</label>
            <select id="reqStudent"></select>

            <label>Company</label>
            <input id="reqCompany"/>

            <label>Role</label>
            <input id="reqRole"/>

            <label>Date</label>
            <input type="date" id="reqDate"/>

            <label>Time</label>
            <input type="time" id="reqTime"/>

            <label>Description</label>
            <textarea id="reqDesc"></textarea>

            <button onclick="submitRequirement()">Add</button>
        </div>
    `;

    AndroidBridge.getAllStudentsForRequirement();
}

function submitRequirement(){
    const studentId = reqStudent.value;
    if(!studentId){
        alert("Select student");
        return;
    }

    const obj = {
        company: reqCompany.value,
        role: reqRole.value,
        date: reqDate.value,
        time: reqTime.value,
        description: reqDesc.value,
        from: "management",
        timestamp: Date.now()
    };

    AndroidBridge.addRequirement(studentId, JSON.stringify(obj));
}

/* ================= LOGOUT ================= */
function logout(){
    if(confirm("⚠️ Are you sure you want to logout?")){
        localStorage.clear();
        location.href = "index1.html";
    }
}

/* ================= SIDEBAR ================= */
document.addEventListener("DOMContentLoaded", ()=>{
    menuBtn.addEventListener("click", ()=> sidebar.classList.toggle("closed"));
});
