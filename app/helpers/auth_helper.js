function generate_subId() {
  // Check if crypto.randomUUID() is available
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  } else {
    // Fallback for very old environments that don't support crypto.randomUUID()
    // This fallback is less cryptographically strong than crypto.randomUUID().
    console.warn("crypto.randomUUID() is not available. Using a less secure fallback. Consider updating your environment or using a polyfill.");
    let d = new Date().getTime();
    let d2 = (typeof performance !== 'undefined' && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      let r = Math.random() * 16;
      if (d > 0) {
        r = (d + r) % 16 | 0;
        d = Math.floor(d / 16);
      } else {
        r = (d2 + r) % 16 | 0;
        d2 = Math.floor(d2 / 16);
      }
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}

export async function generate_recoveryToken() {
  // generate a recovery token using UUID
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    recoveryToken = crypto.randomUUID();
  } else {
    console.warn("crypto.randomUUID() is not available. Using a less secure fallback for recovery token.");
    recoveryToken = 'recovery-' + generate_subId(); // Fallback using the same method as subId
  }
  return recoveryToken;
}

export { generate_subId };

export default {
  generate_subId
};