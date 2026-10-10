document.getElementById("form-register").addEventListener("submit", async (e) => {
  e.preventDefault();
  const userName = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password1").value;
  const confirmPassword = document.getElementById("register-password2").value;
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({userName, email, password, confirmPassword})
  });
  if(res.ok){
    
  }
});