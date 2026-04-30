async function test() {
  const loginRes = await fetch('http://127.0.0.1:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@base2media.ac', password: 'admin123' })
  });
  const data = await loginRes.json();
  const token = data.accessToken;

  const res = await fetch('http://127.0.0.1:4000/api/admin/students', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      firstName: "Test",
      lastName: "Student",
      email: "",
      className: "IT & Technology"
    })
  });
  const text = await res.text();
  console.log("Response:", res.status, text);
}
test();
