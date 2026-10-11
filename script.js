const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('.nav');
toggle?.addEventListener('click',()=>nav.classList.toggle('open'));

document.querySelectorAll('.nav a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')));

const filters=document.querySelectorAll('.filter');
const cards=document.querySelectorAll('.product-card');
filters.forEach(btn=>{
  btn.addEventListener('click',()=>{
    filters.forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
    const f=btn.dataset.filter;
    cards.forEach(card=>{
      card.classList.toggle('hidden', f!=='all' && card.dataset.category!==f);
    });
  });
});

document.querySelectorAll('img').forEach(img=>{
  img.addEventListener('error',()=>{
    img.style.display='none';
    img.parentElement.style.background='linear-gradient(135deg,#eef7e8,#dcefd1)';
  });
});
document.getElementById('year').textContent=new Date().getFullYear();


// Enquiry form: delivers every enquiry to info@siyaramfoods.in.
// Order of attempts: 1) send-enquiry.php on the website's own hosting,
// 2) FormSubmit.co, 3) the visitor's email app (mailto) as a last resort.
const enquiryForm = document.getElementById('enquiryForm');
const formStatus = document.getElementById('formStatus');
const sendEnquiryBtn = document.getElementById('sendEnquiryBtn');
const replyTo = document.getElementById('replyTo');
const enquiryEmail = document.getElementById('enquiryEmail');
const ENQUIRY_EMAIL = 'info@siyaramfoods.in';

// FormSubmit answers success as the STRING "true"/"false", PHP as a boolean.
const isOk = (r) => r && (r.success === true || String(r.success).toLowerCase() === 'true');

async function postJson(url, formData) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    const text = await response.text();
    let result = {};
    try { result = JSON.parse(text); } catch (e) { return false; }   // e.g. 404 page / PHP not available
    return response.ok && isOk(result);
  } catch (e) {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

function buildEnquiryText(data) {
  const g = (k) => (data.get(k) || '').toString().trim();
  return [
    'Name: ' + g('Name'),
    'Company: ' + (g('Company') || 'Not provided'),
    'Email: ' + g('Email'),
    'Phone / WhatsApp: ' + g('Phone'),
    'Product / Requirement: ' + g('Requirement'),
    'Quantity / Packing: ' + (g('Quantity_Packing') || 'Not provided')
  ].join('\n');
}

enquiryForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!enquiryForm.reportValidity()) return;

  if (replyTo && enquiryEmail) replyTo.value = enquiryEmail.value;
  sendEnquiryBtn.disabled = true;
  sendEnquiryBtn.textContent = 'Sending…';
  formStatus.className = 'form-status sending';
  formStatus.textContent = 'Sending your enquiry…';

  const data = new FormData(enquiryForm);
  let sent = await postJson('send-enquiry.php', data);
  if (!sent) sent = await postJson(enquiryForm.dataset.fallbackAction, new FormData(enquiryForm));

  if (sent) {
    enquiryForm.reset();
    formStatus.className = 'form-status success';
    formStatus.textContent = 'Thank you! Your enquiry has been sent to Siyaram Foods. We will contact you soon.';
  } else {
    // Last resort: open the visitor's email app with the enquiry pre-filled.
    const subject = 'New Enquiry — Siyaram Foods Website';
    const mailto = 'mailto:' + ENQUIRY_EMAIL + '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent('Hello Siyaram Foods,\n\nI would like to send an enquiry.\n\n' + buildEnquiryText(data));
    formStatus.className = 'form-status error';
    formStatus.innerHTML = 'We could not send it automatically. Your email app should open with the enquiry ready to send. ' +
      'If it does not, please <a href="' + mailto + '">click here</a> or email <b>' + ENQUIRY_EMAIL + '</b> directly.';
    window.location.href = mailto;
  }
  sendEnquiryBtn.disabled = false;
  sendEnquiryBtn.textContent = 'Send Enquiry';
});


// WhatsApp enquiry: opens WhatsApp with all enquiry details pre-filled.
const whatsappEnquiryBtn = document.getElementById('whatsappEnquiryBtn');
whatsappEnquiryBtn?.addEventListener('click', () => {
  if (!enquiryForm?.reportValidity()) return;

  const data = new FormData(enquiryForm);
  const name = (data.get('Name') || '').toString().trim();
  const company = (data.get('Company') || '').toString().trim();
  const email = (data.get('Email') || '').toString().trim();
  const phone = (data.get('Phone') || '').toString().trim();
  const requirement = (data.get('Requirement') || '').toString().trim();
  const quantity = (data.get('Quantity_Packing') || '').toString().trim();

  const message = [
    'Hello Siyaram Foods,',
    '',
    'I would like to send an enquiry.',
    '',
    `Name: ${name}`,
    `Company: ${company || 'Not provided'}`,
    `Email: ${email}`,
    `Phone / WhatsApp: ${phone}`,
    `Product / Requirement: ${requirement}`,
    `Quantity / Packing Requirement: ${quantity || 'Not provided'}`,
  ].join('\n');

  const whatsappUrl = `https://wa.me/919322791077?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
});
