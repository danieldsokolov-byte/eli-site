// Конфигурация: поставете URL на публикувания Web App от Google Apps Script
const GAS_WEB_APP_URL = 'PASTE_YOUR_WEB_APP_URL_HERE'; // напр. 'https://script.google.com/macros/s/AKfycb.../exec'

document.addEventListener('DOMContentLoaded', () => {
  // Динамична година
  const yearSpan = document.getElementById('yearSpan');
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Мобилно меню
  const mobileBtn = document.getElementById('mobileMenuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileBtn && mobileMenu) {
    mobileBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.toggle('hidden');
      mobileBtn.setAttribute('aria-expanded', String(!isHidden));
    });
    document.querySelectorAll('.mobile-nav, .nav-link').forEach((a) => {
      a.addEventListener('click', () => {
        if (!mobileMenu.classList.contains('hidden')) mobileMenu.classList.add('hidden');
        mobileBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Форма за контакт
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');
  const spinner = submitBtn?.querySelector('.submit-spinner');
  const submitLabel = submitBtn?.querySelector('.submit-label');
  const statusBox = document.getElementById('formStatus');

  const showStatus = (msg, type = 'info') => {
    if (!statusBox) return;
    statusBox.classList.remove('hidden', 'bg-green-50', 'text-green-800', 'border-green-200', 'bg-red-50', 'text-red-800', 'border-red-200', 'bg-blue-50', 'text-blue-800', 'border-blue-200');
    if (type === 'success') {
      statusBox.classList.add('bg-green-50', 'text-green-800', 'border', 'border-green-200');
    } else if (type === 'error') {
      statusBox.classList.add('bg-red-50', 'text-red-800', 'border', 'border-red-200');
    } else {
      statusBox.classList.add('bg-blue-50', 'text-blue-800', 'border', 'border-blue-200');
    }
    statusBox.textContent = msg;
  };

  const setSubmitting = (isSubmitting) => {
    if (!submitBtn) return;
    submitBtn.disabled = isSubmitting;
    if (spinner) spinner.classList.toggle('hidden', !isSubmitting);
    if (submitLabel) submitLabel.textContent = isSubmitting ? 'Изпращане…' : 'Изпрати';
  };

  const setFieldError = (fieldName, message = '') => {
    const el = document.querySelector(`[data-error-for="${fieldName}"]`);
    if (!el) return;
    if (message) {
      el.textContent = message;
      el.classList.remove('hidden');
    } else {
      el.textContent = '';
      el.classList.add('hidden');
    }
  };

  const validate = (values) => {
    let valid = true;
    // Име
    if (!values.name || values.name.trim().length < 2) {
      setFieldError('name', 'Моля, въведете валидно име.');
      valid = false;
    } else {
      setFieldError('name');
    }
    // Имейл
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    if (!emailRe.test(values.email || '')) {
      setFieldError('email', 'Моля, въведете валиден имейл.');
      valid = false;
    } else {
      setFieldError('email');
    }
    // Телефон (по желание)
    if (values.phone && !/^[0-9+()\s-]{6,20}$/.test(values.phone)) {
      setFieldError('phone', 'Моля, въведете валиден телефон или оставете празно.');
      valid = false;
    } else {
      setFieldError('phone');
    }
    // Съобщение
    if (!values.message || values.message.trim().length < 10) {
      setFieldError('message', 'Моля, опишете казуса (минимум 10 символа).');
      valid = false;
    } else {
      setFieldError('message');
    }
    // Съгласие
    if (!values.consent) {
      setFieldError('consent', 'Необходимо е да дадете съгласие за обработка.');
      valid = false;
    } else {
      setFieldError('consent');
    }
    return valid;
  };

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes('PASTE_YOUR_WEB_APP_URL_HERE')) {
      showStatus('Моля, конфигурирайте адреса на Web App (вижте README.md).', 'error');
      return;
    }

    const formData = new FormData(form);
    const values = {
      name: formData.get('name')?.toString().trim(),
      email: formData.get('email')?.toString().trim(),
      phone: formData.get('phone')?.toString().trim(),
      topic: formData.get('topic')?.toString().trim(),
      message: formData.get('message')?.toString().trim(),
      consent: !!form.querySelector('#consent:checked'),
    };

    if (!validate(values)) {
      showStatus('Моля, поправете грешките във формата.', 'error');
      return;
    }

    // Добавяме отметки за източник и време
    formData.append('source', 'website');
    formData.append('timestamp', new Date().toISOString());

    try {
      setSubmitting(true);
      showStatus('Изпращане на запитването…', 'info');

      // Използваме FormData за избягване на CORS preflight
      const res = await fetch(GAS_WEB_APP_URL, {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      });

      if (res.ok) {
        showStatus('Успешно изпратено. Пренасочване…', 'success');
        // Малка пауза за UX
        setTimeout(() => {
          window.location.href = 'success.html';
        }, 300);
      } else {
        const text = await res.text().catch(() => '');
        showStatus('Възникна грешка при изпращане. Опитайте отново по-късно.' + (text ? ` (${text})` : ''), 'error');
      }
    } catch (err) {
      showStatus('Няма връзка със сървъра. Проверете интернет или опитайте по-късно.', 'error');
    } finally {
      setSubmitting(false);
    }
  });
});


