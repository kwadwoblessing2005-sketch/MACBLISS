const form = document.querySelector('#signupForm');
const message = document.querySelector('#formMessage');
const password = document.querySelector('#password');
const togglePassword = document.querySelector('#togglePassword');
const strengthBars = [...document.querySelectorAll('.strength span')];


togglePassword.addEventListener('click', () => {
  const showing = password.type === 'text';
  password.type = showing ? 'password' : 'text';
  togglePassword.textContent = showing ? 'Show' : 'Hide';
  togglePassword.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
});

password.addEventListener('input', () => {
  const value = password.value;
  let score = 0;
  if (value.length >= 8) score++;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score++;
  if (/\d/.test(value)) score++;
  if (/[^A-Za-z0-9]/.test(value)) score++;
  strengthBars.forEach((bar, index) => bar.classList.toggle('active', index < score));
});

form.addEventListener('submit', async event => {
  event.preventEventDefault?.();
  event.preventDefault();
  message.className = 'message';

  if (!form.checkValidity()) {
    message.textContent = 'Please complete every field correctly.';
    form.reportValidity();
    return;
  }
  const values = Object.fromEntries(new FormData(form));

  try {
    const response = await fetch('api-signup.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    });
    const result = await response.json();

    if (!response.ok) {
      message.textContent = result.message || 'Account creation failed.';
      return;
    }

    message.className = 'message success';
    message.textContent = result.message;
    sessionStorage.setItem('macblissSignupPrize', '300');
    form.reset();
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
    strengthBars.forEach(bar => bar.classList.remove('active'));
  } catch (error) {
    message.textContent = 'Could not reach the PHP server. Open this site through localhost.';
  }
});

const stage = document.querySelector('#orbitalStage');
window.addEventListener('pointermove', event => {
  if (window.innerWidth < 800) return;
  const x = (event.clientX / window.innerWidth - 0.5) * 12;
  const y = (event.clientY / window.innerHeight - 0.5) * 12;
  stage.style.transform = `translate(-50%, -50%) rotateY(${x}deg) rotateX(${-y}deg)`;
});
