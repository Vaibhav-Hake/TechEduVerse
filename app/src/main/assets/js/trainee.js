/* ================= GLOBAL ================= */
let currentView = "home";

/* ================= HOME ================= */
function showHome() {
    currentView = "home";
    const content = document.getElementById("content");
    content.innerHTML = `
        <div class="card">
            <h3>📘 Ongoing Batch</h3>
            <p><b>Course:</b> Java Full Stack</p>
            <p><b>Trainer:</b> Rahul Sir</p>
            <p><b>Time:</b> 10 AM – 12 PM</p>
        </div>
    `;
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

/* ================= BATCHES ================= */
function showBatches() {
    currentView = "batches";
    document.getElementById("content").innerHTML = `
        <div class="card">
            <h3>📚 My Batches</h3>
            <ul>
                <li>Java Full Stack</li>
                <li>DSA</li>
            </ul>
        </div>
    `;
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
function logout() {
    location.href = "index1.html";
}

/* ================= SIDEBAR TOGGLE ================= */
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menuBtn");
    const sidebar = document.getElementById("sidebar");
    if(menuBtn && sidebar){
        menuBtn.addEventListener("click", () => sidebar.classList.toggle("closed"));
    }

    const toggleBtn = document.getElementById('sidebarToggle');
    if(toggleBtn && sidebar){
        toggleBtn.addEventListener('click', () => sidebar.classList.toggle('collapsed'));
    }
});
