const roleButtons = document.querySelectorAll(".role-btn");
let selectedRole = "";

roleButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    roleButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedRole = btn.dataset.role;
  });
});

const loginForm = document.getElementById("loginForm");
const forgotLink = document.getElementById("forgotPasswordLink");
const resetContainer = document.getElementById("resetContainer");
const backToLogin = document.getElementById("backToLogin");

const sendOtpBtn = document.getElementById("sendOtpBtn");
const verifyOtpBtn = document.getElementById("verifyOtpBtn");
const resetBtn = document.getElementById("resetBtn");

const otpSection = document.getElementById("otpSection");
const newPasswordSection = document.getElementById("newPasswordSection");


// 🔹 LOGIN HANDLER (UNCHANGED)
loginForm.addEventListener("submit", e => {
  e.preventDefault();

  if (!selectedRole) {
    alert("Please select your role before logging in!");
    return;
  }

  const username = loginForm.querySelector("input[type='text']").value.trim();
  const password = loginForm.querySelector("input[type='password']").value.trim();

  if (!username || !password) {
    alert("Please enter both username and password!");
    return;
  }

  const loginData = { role: selectedRole, username, password };

  if (typeof AndroidBridge !== "undefined" && AndroidBridge.loginUser) {
    AndroidBridge.loginUser(JSON.stringify(loginData));
  } else {
    alert(`(Testing mode) Welcome ${username}`);
  }
});


// 🔹 FORGOT PASSWORD (UNCHANGED)
forgotLink.onclick = (e) => {
  e.preventDefault();
  if (!selectedRole) {
    alert("Please select your role first!");
    return;
  }
  loginForm.classList.add("hidden");
  resetContainer.classList.remove("hidden");
};


// 🔹 BACK TO LOGIN (🔥 FIXED — NO RELOAD)
backToLogin.onclick = (e) => {
  e.preventDefault();
  resetContainer.classList.add("hidden");
  loginForm.classList.remove("hidden");
};


// 🔹 SEND OTP (UNCHANGED)
sendOtpBtn.onclick = () => {
  const mobile = document.getElementById("resetMobile").value.trim();

  if (mobile.length !== 10) {
    alert("Enter valid mobile number");
    return;
  }

  const otpData = { role: selectedRole, mobile };

  if (typeof AndroidBridge !== "undefined" && AndroidBridge.sendOtp) {
    AndroidBridge.sendOtp(JSON.stringify(otpData));
  }

  otpSection.classList.remove("hidden");
  alert("OTP sent to your mobile");
};


// 🔹 VERIFY OTP (UNCHANGED)
verifyOtpBtn.onclick = () => {
  const otp = document.getElementById("otpInput").value.trim();

  if (!otp) {
    alert("Enter OTP");
    return;
  }

  if (typeof AndroidBridge !== "undefined" && AndroidBridge.verifyOtp) {
    AndroidBridge.verifyOtp(otp);
  }

  newPasswordSection.classList.remove("hidden");
};


// 🔹 RESET PASSWORD (UNCHANGED)
resetBtn.onclick = () => {
  const newPassword = document.getElementById("newPassword").value.trim();

  if (newPassword.length < 6) {
    alert("Password must be at least 6 characters");
    return;
  }

  const resetData = { role: selectedRole, newPassword };

  if (typeof AndroidBridge !== "undefined" && AndroidBridge.updatePassword) {
    AndroidBridge.updatePassword(JSON.stringify(resetData));
  } else {
    onPasswordResetSuccess();
  }
};


// 🔹 CALLBACKS FROM ANDROID (UNCHANGED)
function onLoginSuccess() {
  alert("✅ Login Successful!");
  window.location.href = "dashboard.html";
}

function onLoginFailed() {
  alert("❌ Invalid Username or Password!");
}

function onPasswordResetSuccess() {
  alert("✅ Password updated successfully!");
  window.location.href = "login.html";
}

function onPasswordResetFailed() {
  alert("❌ OTP verification failed!");
}
