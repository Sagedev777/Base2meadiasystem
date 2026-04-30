async function test() {
  const loginRes = await fetch('http://127.0.0.1:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@base2media.ac', password: 'admin123' })
  });
  const data = await loginRes.json();
  const token = data.accessToken;
  console.log("Token:", token);

  const adminRes = await fetch('http://127.0.0.1:4000/api/admin/students', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const adminData = await adminRes.json();
  console.log("Admin response:", adminData);
}
test();
