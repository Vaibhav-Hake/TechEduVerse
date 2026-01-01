// signup.js

document.addEventListener("DOMContentLoaded", () => {
  const roleButtons = document.querySelectorAll(".role-btn");
  const forms = {
    trainer: document.getElementById("trainerForm"),
    trainee: document.getElementById("traineeForm"),
    management: document.getElementById("managementForm"),
  };

  // Hide all forms initially
  Object.values(forms).forEach((f) => f.classList.add("hidden"));

  // Role button selection
  roleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      roleButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      Object.values(forms).forEach((f) => f.classList.add("hidden"));
      const role = btn.dataset.role;
      forms[role].classList.remove("hidden");

      window.scrollTo({ top: forms[role].offsetTop - 20, behavior: "smooth" });
    });
  });

  // Same Address Auto-fill
  const sameAddressCheckbox = document.getElementById("sameAddress");
  if (sameAddressCheckbox) {
    sameAddressCheckbox.addEventListener("change", () => {
      const fields = ["Street", "City", "Taluka", "District", "State", "Country"];
      if (sameAddressCheckbox.checked) {
        fields.forEach((f) => {
          const permInput = document.getElementById(`perm${f}`);
          const tempInput = document.getElementById(`temp${f}`);
          if (permInput && tempInput) {
            tempInput.value = permInput.value;
            tempInput.readOnly = true;
          }
        });
      } else {
        fields.forEach((f) => {
          const tempInput = document.getElementById(`temp${f}`);
          if (tempInput) {
            tempInput.value = "";
            tempInput.readOnly = false;
          }
        });
      }
    });
  }

  // Handle form submissions
  Object.keys(forms).forEach((role) => {
    forms[role].addEventListener("submit", async (e) => {
      e.preventDefault();

      const inputs = forms[role].querySelectorAll("input, textarea");
      const data = { role };

      // Collect normal fields
      for (const input of inputs) {
        if (input.type === "file") continue;
        const key =
          input.id || input.placeholder.replace(/\s+/g, "_").toLowerCase();
        data[key] = input.value.trim();
      }

      // Handle files (Image + PDF compression)
      const files = forms[role].querySelectorAll("input[type='file']");
      for (const fileInput of files) {
        const key = fileInput.id;
        if (fileInput.files.length > 0) {
          const file = fileInput.files[0];

          if (file.type.startsWith("image/")) {
            data[key] = await compressImage(file);
          } else if (file.type === "application/pdf") {
            data[key] = await compressPDF(file);
          } else {
            data[key] = file;
          }
        } else {
          data[key] = "";
        }
      }

      // Trainee validation
      if (
        role === "trainee" &&
        (!data["traineeUsername"] || !data["traineePassword"])
      ) {
        alert("Please enter a valid username and password!");
        return;
      }

      // ✅ Upload + Redirect
      if (typeof AndroidBridge !== "undefined" && AndroidBridge.uploadUserData) {
        AndroidBridge.uploadUserData(JSON.stringify(data));

        alert("Registration successful! Redirecting to login...");

        // ⏳ Small delay then redirect
        setTimeout(() => {
          window.location.href = "login.html";
        }, 1000);
      } else {
        console.log("Browser mode — Data:", data);
        alert("Registration successful! Redirecting to login...");
        window.location.href = "login.html";
      }
    });
  });
});

// Image compression
async function compressImage(file) {
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  };
  try {
    return await imageCompression(file, options);
  } catch (err) {
    console.error("Image compression error:", err);
    return file;
  }
}

// PDF compression
async function compressPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
    });
    return new File([compressedBytes], file.name, {
      type: "application/pdf",
    });
  } catch (err) {
    console.error("PDF compression error:", err);
    return file;
  }
}
