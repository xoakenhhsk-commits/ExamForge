const register = async () => {
  const res = await fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser123', password: 'password123' })
  });
  console.log('Register:', await res.json());
};

const login = async () => {
  const res = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser123', password: 'password123' })
  });
  console.log('Login:', await res.json());
};

(async () => {
  await register();
  await login();
})();
