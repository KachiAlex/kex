function sendEmail({ to, subject, html }) {
	console.log('[Email:DISABLED]', { to, subject });
	return Promise.resolve({ id: 'disabled', status: 'skipped' });
}

function otpHtml() {
	return '';
}

module.exports = { sendEmail, otpHtml }; 