// OPEN & CLOSE MODALS
document.getElementById("loginBtn").addEventListener("click", () => {
  document.getElementById("loginModal").classList.add("active");
});

document.getElementById("signupBtn").addEventListener("click", () => {
  document.getElementById("signupModal").classList.add("active");
});

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

// SIMPLE VALIDATION
function handleLogin() {
  const email = document.getElementById("loginEmail").value;
  const pass = document.getElementById("loginPassword").value;
  if (!email || !pass) {
    alert("Please fill in all fields!");
    return;
  }
  alert("Login successful! (Demo)");
  closeModal("loginModal");
}

function handleSignup() {
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const pass = document.getElementById("signupPassword").value;
  if (!name || !email || !pass) {
    alert("Please fill in all fields!");
    return;
  }
  alert("Signup successful! (Demo)");
  closeModal("signupModal");
}

// CLOSE MODAL ON OUTSIDE CLICK
window.onclick = function (event) {
  if (event.target.classList.contains("modal")) {
    event.target.classList.remove("active");
  }
};
