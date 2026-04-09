fetch("http://localhost:8081/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ userName: "admin@baocaovn.com", password: "admin123456" })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
