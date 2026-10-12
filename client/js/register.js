document.getElementById("form-register").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userName = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password1").value;
  const confirmPassword = document.getElementById("register-password2").value;
  const res = await fetch("/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({userName, email, password, confirmPassword})
  });
  const data = await res.json();
  if(res.ok){
    window.location.href = data.path;
  }
});