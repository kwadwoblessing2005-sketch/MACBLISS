const form = document.querySelector('#loginForm');
const message = document.querySelector('#loginMessage');
const password = form.elements.password;
document.querySelector('#toggleLoginPassword').addEventListener('click', event => {
  password.type = password.type === 'password' ? 'text' : 'password';
  event.currentTarget.textContent = password.type === 'password' ? 'Show' : 'Hide';
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.checkValidity()) return form.reportValidity();
  const values = Object.fromEntries(new FormData(form));
  message.textContent = '';
  try {
    const response = await fetch('api-login.php', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(values) });
    const result = await response.json();
    if (!response.ok) { message.textContent = result.message; return; }
    window.location.href = 'dashboard.html';
  } catch (_) { message.textContent = 'Could not reach the server.'; }
});
