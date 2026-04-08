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
/* ================= MESSAGES ================= */
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
function openTrainerChat(){

    //const trainerId = localStorage.getItem("trainerId");

    if(!trainerId){
        alert("Trainer not assigned yet");
        return;
    }

    openPersonalChat(trainerId, "trainer");
}
/* ================= GLOBAL ================= */
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


/* ================= REQUIREMENTS ================= */
function showRequirements() {
    currentView = "requirements";

    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>📌 Requirements</h3>
            <p style="opacity:.6">Loading...</p>
        </div>
    `;

    const uid = localStorage.getItem("uuid");

    if (!uid) {
        document.getElementById("content").innerHTML = `
            <div class="card empty-card">
                <h3>📌 Requirements</h3>
                <p>No user logged in</p>
            </div>
        `;
        return;
    }

  AndroidBridge.getMyRequirements(uid);

}



function displayRequirements(data) {
    let req = {};

    try {
        req = typeof data === "string" ? JSON.parse(data) : data;
    } catch (e) {
        console.error("Requirement parse error", e);
    }

    // 🔴 No requirements
    if (!req || Object.keys(req).length === 0) {
        document.getElementById("content").innerHTML = `
            <div class="card empty-card">
                <h3>📌 Requirements</h3>
                <p style="opacity:.6">No requirements available</p>
            </div>
        `;
        return;
    }

    let html = `<h2>📌 My Requirements</h2>`;

    Object.keys(req).forEach(id => {
        const r = req[id];

        html += `
        <div class="card requirement-card">
            <h3>${r.company || "Company"}</h3>
            <p><b>Role:</b> ${r.role || "-"}</p>
            <p><b>Description:</b> ${r.description || "-"}</p>

            <div class="req-footer">
                <span>📅 ${r.date || ""}</span>
                <span>⏰ ${r.time || ""}</span>
            </div>

            <div class="req-from">
                From: ${r.from || "N/A"}
            </div>
        </div>
        `;
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

/* ================= mock Test ================= */

function showMockTest() {
    currentView = "mocktest";

    document.getElementById("content").innerHTML = `
        <h2>🧪 Mock Test Platform</h2>

        <div class="level-select">
            <button onclick="selectLevel('easy')">Easy</button>
            <button onclick="selectLevel('medium')">Medium</button>
            <button onclick="selectLevel('hard')">Hard</button>
        </div>

        <div class="grid">
            <div class="card" onclick="startMock('HTML')">HTML</div>
            <div class="card" onclick="startMock('CSS')">CSS</div>
            <div class="card" onclick="startMock('JavaScript')">JavaScript</div>
            <div class="card" onclick="startMock('Java')">Java</div>
            <div class="card" onclick="startMock('Python')">Python</div>
            <div class="card" onclick="startMock('DSA')">DSA</div>
            <div class="card" onclick="startMock('Aptitude')">Aptitude</div>
        </div>

        <div id="mockArea"></div>
    `;
}
const mockQuestions = {
    Java: {
        easy: [
            { q: "JVM stands for?", options: ["Java Virtual Machine", "Java Variable Machine"], ans: 0 }
        ],
        medium: [
            { q: "Which is not OOP?", options: ["Encapsulation", "Compilation"], ans: 1 }
        ],
        hard: [
            { q: "Which memory stores objects?", options: ["Heap", "Stack"], ans: 0 }
        ]
    },

    Aptitude: {
        easy: [
            { q: "5 + 5 = ?", options: ["10", "20"], ans: 0 }
        ],
        medium: [
            { q: "20 * 2 = ?", options: ["30", "40"], ans: 1 }
        ],
        hard: [
            { q: "100 / 4 = ?", options: ["25", "20"], ans: 0 }
        ]
    }
};

let timer;
let timeLeft = 30;

function startMock(domain) {
    mqDomain = domain;
    mqIndex = 0;
    mqScore = 0;
    timeLeft = 30;

    startTimer();
    loadMockQuestion();
}
function startTimer() {
    clearInterval(timer);

    timer = setInterval(() => {
        timeLeft--;

        document.getElementById("timerBox").innerText =
            "⏱ Time Left: " + timeLeft + "s";

        if (timeLeft <= 0) {
            clearInterval(timer);
            endMockTest();
        }
    }, 1000);
}

function loadMockQuestion() {

    let qList = mockQuestions[mqDomain]?.[selectedLevel];

    if (!qList) {
        document.getElementById("mockArea").innerHTML = "No Questions";
        return;
    }

    let q = qList[mqIndex];

    let html = `
        <div id="timerBox">⏱ Time Left: ${timeLeft}s</div>
        <h3>${mqDomain} (${selectedLevel})</h3>
        <p>${q.q}</p>
    `;

    q.options.forEach((opt, i) => {
        html += `<button onclick="checkMockAnswer(${i})">${opt}</button><br><br>`;
    });

    document.getElementById("mockArea").innerHTML = html;
}

function checkMockAnswer(selected) {

    let qList = mockQuestions[mqDomain][selectedLevel];
    let q = qList[mqIndex];

    if (selected === q.ans) {
        mqScore++;
    }

    mqIndex++;

    if (mqIndex < qList.length) {
        loadMockQuestion();
    } else {
        endMockTest();
    }
}
function endMockTest() {
    clearInterval(timer);

    // 🔥 SAVE TO FIREBASE
    if (window.AndroidBridge) {
        AndroidBridge.saveMockResult(mqDomain, selectedLevel, mqScore);
    }

    document.getElementById("mockArea").innerHTML = `
        <h2>🎉 Test Finished</h2>
        <p>Score: ${mqScore}</p>
        <button onclick="showMockTest()">Back</button>
    `;
    AndroidBridge.updateLeaderboard(mqScore);
}
let mqDomain = "";
let mqIndex = 0;
let mqScore = 0;

let selectedLevel = "easy";

function selectLevel(level) {
    selectedLevel = level;
    alert("Selected Level: " + level.toUpperCase());
}

function openCodingTest() {
    document.getElementById("content").innerHTML = `
        <h2>💻 Coding Test Platform</h2>

        <div class="grid">
            <div class="card" onclick="loadDomain('DSA')">🧠 DSA</div>
            <div class="card" onclick="loadDomain('Java')">☕ Java</div>
            <div class="card" onclick="loadDomain('Python')">🐍 Python</div>
            <div class="card" onclick="loadDomain('Number')">🔢 Number Programming</div>
        </div>

        <div id="problemList"></div>
    `;
}
async function runCode(problemId) {

    const code = document.getElementById("codeEditor").value;
    const lang = document.getElementById("lang").value;

    let language_id = 62; // Java
    if (lang === "python") language_id = 71;

    try {
        const response = await fetch("https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=false&wait=true", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-RapidAPI-Key": "YOUR_API_KEY", // ⚠️ replace
                "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
            },
            body: JSON.stringify({
                source_code: code,
                language_id: language_id
            })
        });

        const data = await response.json();

        let result = data.stdout || data.stderr || data.compile_output || "No Output";

        document.getElementById("outputBox").innerHTML =
            "<pre>" + result + "</pre>";

        // SAVE
        if (window.AndroidBridge) {
            AndroidBridge.saveCodingSubmission(problemId, code, lang, result);
        }

    } catch (err) {
        document.getElementById("outputBox").innerHTML =
            "<pre>Error running code</pre>";
    }
}
function openProblem(id){

    const problem = dsaProblems.find(p => p.id === id);

    if(!problem){
        alert("Problem not found");
        return;
    }

    document.getElementById("content").innerHTML = `
        <h2>${problem.title}</h2>
        <p>${problem.description || "Solve this problem"}</p>

        <textarea id="codeEditor">// write code</textarea>
        <button onclick="runCode()">Run</button>
    `;
}
function showLeaderboard(data){

    let arr = [];

    try{
        arr = JSON.parse(data);
    }catch(e){
        console.error("Leaderboard parse error", e);
    }

    if(!arr || arr.length === 0){
        document.getElementById("content").innerHTML =
            "<h2>🏆 Leaderboard</h2><p>No data</p>";
        return;
    }

    arr.sort((a,b)=> (b.score||0) - (a.score||0));

    let html = "<h2>🏆 Leaderboard</h2>";

    arr.forEach((u,i)=>{
        html += `
            <div class="card">
                <h3>#${i+1} ${u.user}</h3>
                <p>Score: ${u.score || 0}</p>
            </div>
        `;
    });

    document.getElementById("content").innerHTML = html;
}

async function loadOnlineProblems() {

    document.getElementById("problemList").innerHTML = "Loading problems...";

    try {
        const res = await fetch("https://codeforces.com/api/problemset.problems");
        const data = await res.json();

        const problems = data.result.problems.slice(0, 20); // limit 20

        let html = "<h3>🌐 Online Problems</h3>";

        problems.forEach(p => {
            html += `
                <div class="card" onclick="openOnlineProblem('${p.contestId}','${p.index}')">
                    <h3>${p.name}</h3>
                    <p>Rating: ${p.rating || "N/A"}</p>
                    <p>Tags: ${(p.tags || []).join(", ")}</p>
                </div>
            `;
        });

        document.getElementById("problemList").innerHTML = html;

    } catch (e) {
        document.getElementById("problemList").innerHTML = "Failed to load problems";
    }
}
function openOnlineProblem(contestId, index) {

    const url = `https://codeforces.com/problemset/problem/${contestId}/${index}`;

    document.getElementById("content").innerHTML = `
        <h2>🧠 Solve Problem</h2>

        <a href="${url}" target="_blank">👉 Open Problem Statement</a>

        <select id="lang">
            <option value="java">Java</option>
            <option value="python">Python</option>
        </select>

        <textarea id="codeEditor" style="height:200px;">
// Write your code here
        </textarea>

        <button onclick="runCode('online_problem')">▶ Run Code</button>

        <div id="outputBox"></div>
    `;
}
function openCodingTest() {
    document.getElementById("content").innerHTML = `
        <h2>💻 Coding Test Platform</h2>

        <button onclick="loadOnlineProblems()">🌐 Load Online Problems</button>

        <div id="problemList"></div>
    `;
}

function showDSAProblems(){

    let html = "<h2>🧠 DSA Problems</h2>";

    dsaProblems.forEach(p=>{
        html += `
            <div class="card" onclick="openProblem('${p.id}')">
                <h3>${p.title}</h3>
                <p>${p.difficulty}</p>
            </div>
        `;
    });

    document.getElementById("content").innerHTML = html;
}

function showAnalytics(data){

    let obj = {};

    try{
        obj = JSON.parse(data);
    }catch(e){
        console.error("Analytics parse error");
    }

    let total = 0;
    let count = 0;

    Object.values(obj).forEach(t=>{
        total += Number(t.score || 0); // ✅ FIX
        count++;
    });

    let avg = count ? (total / count).toFixed(2) : 0;

    document.getElementById("content").innerHTML = `
        <h2>📈 Performance</h2>
        <p>Total Tests: ${count}</p>
        <p>Average Score: ${avg}</p>
    `;
}

function showMockHistory(data){

    let obj = JSON.parse(data);
    let html = "<h2>📊 My Performance</h2>";

    Object.keys(obj).forEach(k=>{
        let t = obj[k];

        html += `
            <div class="card">
                <h3>${t.domain || "Test"}</h3>
                <p>Score: ${t.score}</p>
                <p>Level: ${t.level}</p>
            </div>
        `;
    });

    document.getElementById("content").innerHTML = html;
}

function loadDomain(domain) {

    let list = codingProblems[domain];

    let html = `<h3>📘 ${domain} Problems</h3>`;

    list.forEach(p => {
        html += `
            <div class="card" onclick="openProblem('${domain}','${p.id}')">
                <h3>${p.title}</h3>
                <p>${p.desc}</p>
            </div>
        `;
    });

    document.getElementById("problemList").innerHTML = html;
}
function openProblem(domain, id) {

    const problem = codingProblems[domain].find(p => p.id === id);

    document.getElementById("content").innerHTML = `
        <h2>${problem.title}</h2>
        <p>${problem.desc}</p>

        <select id="lang">
            <option value="java">Java</option>
            <option value="python">Python</option>
        </select>

        <textarea id="codeEditor" style="height:200px;">
// Write your code here
        </textarea>

        <button onclick="runCode('${id}')">▶ Run Code</button>

        <div id="outputBox"></div>
    `;
}

/* ================= LOGOUT ================= */
function logout(){
    if(confirm("⚠️ Are you sure you want to logout?")){
        localStorage.clear();
        location.href = "index1.html";
    }
}
function toggleSidebar() {
    const sidebar = document.getElementById("sidebar");
    const content = document.querySelector(".content-area");

    sidebar.classList.toggle("closed");
    content.classList.toggle("full");
}