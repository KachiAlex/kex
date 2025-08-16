const Resend = require('resend').Resend;

async function sendEmail({ to, subject, html }) {
	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.EMAIL_FROM || 'KEX <no-reply@kex.local>';
	if (!apiKey) {
		// Fallback: log for development
		console.log('[Email:FALLBACK]', { to, subject, html });
		return { id: 'fallback', status: 'logged' };
	}
	const resend = new Resend(apiKey);
	const result = await resend.emails.send({ from, to, subject, html });
	return result;
}

function otpHtml({ otp, name = '' }) {
	return `
		<div style="font-family:Inter,system-ui,Arial,sans-serif;line-height:1.6">
			<h2>Verify your email</h2>
			<p>Hi ${name || 'there'},</p>
			<p>Your verification code is:</p>
			<p style="font-size:24px;font-weight:700;letter-spacing:4px">${otp}</p>
			<p>This code will expire in 10 minutes. If you didn't request this, you can ignore this email.</p>
			<p>— KEX</p>
		</div>
	`;
}

module.exports = { sendEmail, otpHtml }; 