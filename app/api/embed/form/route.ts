// app/api/embed/form/route.ts
import { NextRequest, NextResponse } from 'next/server'

const FORM_SCRIPT = (baseUrl: string) => `
(function() {
  // Find the script tag to get params
  var scripts = document.querySelectorAll('script[src*="/api/embed/form"]');
  var script = scripts[scripts.length - 1];
  var src = script.getAttribute('src') || '';
  var params = new URL(src, window.location.origin).searchParams;
  var orgSlug = params.get('org') || '';
  function escAttr(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  var accentRaw = params.get('accent') || '#E8642C';
  var accent = /^#[0-9a-fA-F]{3,8}$/.test(accentRaw) ? accentRaw : '#E8642C';
  var title = escAttr(params.get('title') || 'Get in Touch');
  var subtitle = escAttr(params.get('subtitle') || 'Fill in your details and we\\'ll get back to you shortly.');
  var btnText = escAttr(params.get('btn') || 'Submit');
  var source = params.get('source') || 'embed_form';

  if (!orgSlug) {
    console.error('[Impact] Missing org parameter in embed script URL');
    return;
  }

  // Grab UTM params from the host page URL
  var pageParams = new URLSearchParams(window.location.search);
  var utmSource = pageParams.get('utm_source') || '';
  var utmMedium = pageParams.get('utm_medium') || '';
  var utmCampaign = pageParams.get('utm_campaign') || '';
  var utmContent = pageParams.get('utm_content') || '';
  var utmTerm = pageParams.get('utm_term') || '';

  // Create container
  var container = document.createElement('div');
  container.id = 'impact-embed-form';
  script.parentNode.insertBefore(container, script);

  // Inject styles + form
  container.innerHTML = '<style>' +
    '#impact-embed-form *{box-sizing:border-box;margin:0;padding:0;}' +
    '#impact-embed-form{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:480px;margin:0 auto;}' +
    '.impact-form-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);}' +
    '.impact-form-title{font-size:22px;font-weight:700;color:#1a1a2e;margin-bottom:6px;}' +
    '.impact-form-subtitle{font-size:14px;color:#6b7280;margin-bottom:24px;line-height:1.5;}' +
    '.impact-form-group{margin-bottom:16px;}' +
    '.impact-form-label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;}' +
    '.impact-form-input{width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:10px;font-size:14px;color:#1a1a2e;background:#f9fafb;outline:none;transition:border-color .2s,box-shadow .2s;}' +
    '.impact-form-input:focus{border-color:' + accent + ';box-shadow:0 0 0 3px ' + accent + '22;}' +
    '.impact-form-input::placeholder{color:#9ca3af;}' +
    '.impact-form-btn{width:100%;padding:12px 20px;background:' + accent + ';color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;transition:opacity .2s;margin-top:8px;}' +
    '.impact-form-btn:hover{opacity:0.9;}' +
    '.impact-form-btn:disabled{opacity:0.6;cursor:not-allowed;}' +
    '.impact-form-error{color:#dc2626;font-size:13px;margin-top:8px;display:none;}' +
    '.impact-form-success{text-align:center;padding:40px 20px;}' +
    '.impact-form-success-icon{width:56px;height:56px;border-radius:50%;background:' + accent + '15;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;}' +
    '.impact-form-success-icon svg{width:28px;height:28px;color:' + accent + ';}' +
    '.impact-form-success h3{font-size:20px;font-weight:700;color:#1a1a2e;margin-bottom:8px;}' +
    '.impact-form-success p{font-size:14px;color:#6b7280;line-height:1.5;}' +
    '.impact-form-powered{text-align:center;margin-top:16px;font-size:11px;color:#9ca3af;}' +
    '.impact-form-powered a{color:#9ca3af;text-decoration:none;}' +
    '.impact-form-powered a:hover{color:#6b7280;}' +
  '</style>' +
  '<div class="impact-form-card">' +
    '<h2 class="impact-form-title">' + title + '</h2>' +
    '<p class="impact-form-subtitle">' + subtitle + '</p>' +
    '<form id="impact-lead-form" novalidate>' +
      '<div class="impact-form-group">' +
        '<label class="impact-form-label" for="impact-name">Full Name *</label>' +
        '<input class="impact-form-input" id="impact-name" name="name" type="text" placeholder="John Smith" required />' +
      '</div>' +
      '<div class="impact-form-group">' +
        '<label class="impact-form-label" for="impact-email">Email *</label>' +
        '<input class="impact-form-input" id="impact-email" name="email" type="email" placeholder="john@company.com" required />' +
      '</div>' +
      '<div class="impact-form-group">' +
        '<label class="impact-form-label" for="impact-phone">Phone</label>' +
        '<input class="impact-form-input" id="impact-phone" name="phone" type="tel" placeholder="+44 7700 900000" />' +
      '</div>' +
      '<div class="impact-form-group">' +
        '<label class="impact-form-label" for="impact-company">Company</label>' +
        '<input class="impact-form-input" id="impact-company" name="company" type="text" placeholder="Company name" />' +
      '</div>' +
      '<div class="impact-form-error" id="impact-form-error"></div>' +
      '<button class="impact-form-btn" type="submit">' + btnText + '</button>' +
    '</form>' +
    '<div class="impact-form-powered">Powered by <a href="https://driveimpact.io" target="_blank" rel="noopener">Impact</a></div>' +
  '</div>';

  // Handle submit
  var form = document.getElementById('impact-lead-form');
  var errorEl = document.getElementById('impact-form-error');
  var card = container.querySelector('.impact-form-card');

  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var name = document.getElementById('impact-name').value.trim();
    var email = document.getElementById('impact-email').value.trim();
    var phone = document.getElementById('impact-phone').value.trim();
    var company = document.getElementById('impact-company').value.trim();

    // Validate
    if (!name) { showError('Please enter your name.'); return; }
    if (!email || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) { showError('Please enter a valid email.'); return; }

    errorEl.style.display = 'none';

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending...';

    var payload = {
      org_slug: orgSlug,
      name: name,
      email: email,
      source: source
    };
    if (phone) payload.phone = phone;
    if (company) payload.company = company;
    if (utmSource) payload.utm_source = utmSource;
    if (utmMedium) payload.utm_medium = utmMedium;
    if (utmCampaign) payload.utm_campaign = utmCampaign;
    if (utmContent) payload.utm_content = utmContent;
    if (utmTerm) payload.utm_term = utmTerm;
    payload.custom = { page_url: window.location.href, referrer: document.referrer };

    fetch('${baseUrl}/api/webhooks/lead-form', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    .then(function(res) {
      if (!res.ok) return res.json().then(function(d) { throw new Error(d.error || 'Submission failed'); });
      return res.json();
    })
    .then(function() {
      card.innerHTML =
        '<div class="impact-form-success">' +
          '<div class="impact-form-success-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="' + accent + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' +
          '</div>' +
          '<h3>Thank you!</h3>' +
          '<p>Your details have been submitted successfully. We\\'ll be in touch soon.</p>' +
        '</div>' +
        '<div class="impact-form-powered">Powered by <a href="https://driveimpact.io" target="_blank" rel="noopener">Impact</a></div>';
    })
    .catch(function(err) {
      showError(err.message || 'Something went wrong. Please try again.');
      btn.disabled = false;
      btn.textContent = btnText;
    });
  });

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
})();
`

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://driveimpact.io'

  return new NextResponse(FORM_SCRIPT(baseUrl), {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  })
}
