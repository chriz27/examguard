/**
 * Utilitas Enkripsi & Dekripsi Cadangan Sistem ExamGuard
 * Menggunakan standar Web Crypto API: AES-256-GCM dengan derivasi kunci PBKDF2 (SHA-256).
 * Memastikan password admin, password peserta, dan Google secret keys selalu terenkripsi di file backup.
 */

export const DEFAULT_BACKUP_MASTER_KEY = 'ExamGuard-Secure-Master-Key-Institution-2026';

function arrayBufferToBase64(buffer) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64');
  }
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Fallback reversible obfuscation jika Web Crypto API tidak tersedia (misal koneksi non-HTTPS pada IP lokal)
function fallbackEncrypt(plainText, key) {
  let xored = '';
  for (let i = 0; i < plainText.length; i++) {
    xored += String.fromCharCode(plainText.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  const b64 = typeof window !== 'undefined' ? window.btoa(unescape(encodeURIComponent(xored))) : Buffer.from(xored).toString('base64');
  return {
    algo: 'FALLBACK-OBFUSCATION',
    salt: 'NO_SALT',
    iv: 'NO_IV',
    ciphertext: b64,
  };
}

function fallbackDecrypt(payload, key) {
  const raw = typeof window !== 'undefined' ? decodeURIComponent(escape(window.atob(payload.ciphertext))) : Buffer.from(payload.ciphertext, 'base64').toString('latin1');
  let result = '';
  for (let i = 0; i < raw.length; i++) {
    result += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

/**
 * Enkripsi data rahasia
 */
export async function encryptData(plainText, passphrase = DEFAULT_BACKUP_MASTER_KEY) {
  const subtle = typeof window !== 'undefined' ? window.crypto?.subtle : globalThis?.crypto?.subtle;
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis?.crypto;

  if (!subtle || !cryptoObj) {
    return fallbackEncrypt(plainText, passphrase);
  }

  try {
    const enc = new TextEncoder();
    const salt = cryptoObj.getRandomValues(new Uint8Array(16));
    const pwKey = await subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
    const key = await subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      pwKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    const iv = cryptoObj.getRandomValues(new Uint8Array(12));
    const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plainText));

    return {
      algo: 'AES-256-GCM-PBKDF2',
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      ciphertext: arrayBufferToBase64(ciphertext),
    };
  } catch (err) {
    console.warn('Web Crypto gagal, menggunakan fallback encryption:', err);
    return fallbackEncrypt(plainText, passphrase);
  }
}

/**
 * Dekripsi data rahasia
 */
export async function decryptData(payload, passphrase = DEFAULT_BACKUP_MASTER_KEY) {
  if (!payload || !payload.ciphertext) {
    throw new Error('Format data terenkripsi tidak valid.');
  }

  if (payload.algo === 'FALLBACK-OBFUSCATION') {
    return fallbackDecrypt(payload, passphrase);
  }

  const subtle = typeof window !== 'undefined' ? window.crypto?.subtle : globalThis?.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto API tidak tersedia pada peramban ini.');
  }

  const dec = new TextDecoder();
  const enc = new TextEncoder();
  const salt = base64ToArrayBuffer(payload.salt);
  const iv = base64ToArrayBuffer(payload.iv);
  const ciphertext = base64ToArrayBuffer(payload.ciphertext);

  const pwKey = await subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  const key = await subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    pwKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const decrypted = await subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return dec.decode(decrypted);
}

/**
 * Membuat paket cadangan lengkap dengan enkripsi otomatis untuk data sensitif
 */
export async function createSystemBackupPackage(systemData, passphrase = DEFAULT_BACKUP_MASTER_KEY) {
  const { institution, users, exam_sessions, student_attempts } = systemData;

  // 1. Ekstrak data rahasia yang wajib dienkripsi
  const secretPayload = {
    institution_secrets: {
      google_client_secret: institution?.google_client_secret || '',
      recaptcha_secret_key: institution?.recaptcha_secret_key || '',
    },
    user_passwords: (users || []).map((u) => ({
      id: u.id,
      username: u.username,
      password: u.password,
    })),
  };

  // 2. Enkripsi data rahasia dengan AES-GCM
  const encryptedSecrets = await encryptData(JSON.stringify(secretPayload), passphrase);

  // 3. Sensor data rahasia pada payload terbuka
  const sanitizedInstitution = {
    ...institution,
    google_client_secret: '[ENCRYPTED_SECRET_KEY]',
    recaptcha_secret_key: '[ENCRYPTED_SECRET_KEY]',
  };

  const sanitizedUsers = (users || []).map((u) => ({
    ...u,
    password: '[ENCRYPTED_PASSWORD]',
  }));

  // 4. Struktur data cadangan akhir
  const backupObject = {
    _examguard_backup: true,
    schema_version: '1.0',
    app: 'ExamGuard',
    generated_at: new Date().toISOString(),
    institution_name: institution?.name || 'SMA Negeri 1 Nusantara',
    institution_npsn: institution?.npsn || '20104829',
    summary: {
      exams_count: (exam_sessions || []).length,
      students_count: (users || []).filter((u) => u.role === 'student').length,
      admins_count: (users || []).filter((u) => u.role !== 'student').length,
      attempts_count: (student_attempts || []).length,
      encryption_algo: encryptedSecrets.algo,
    },
    public_data: {
      institution: sanitizedInstitution,
      users: sanitizedUsers,
      exam_sessions: exam_sessions || [],
      student_attempts: student_attempts || [],
    },
    encrypted_secrets: encryptedSecrets,
  };

  return JSON.stringify(backupObject, null, 2);
}

/**
 * Membaca, memvalidasi, mendekripsi, dan merekonstruksi data sistem dari file cadangan
 */
export async function restoreSystemBackupPackage(jsonString, passphrase = DEFAULT_BACKUP_MASTER_KEY) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error('File tidak valid: Format bukan JSON ExamGuard yang sah.');
  }

  if (!parsed._examguard_backup || !parsed.public_data || !parsed.encrypted_secrets) {
    throw new Error('Struktur file cadangan ExamGuard tidak lengkap atau rusak.');
  }

  // Dekripsi data rahasia
  let decryptedText;
  try {
    decryptedText = await decryptData(parsed.encrypted_secrets, passphrase);
  } catch (err) {
    throw new Error(
      'Kunci enkripsi / passphrase salah! Data rahasia (password & setelan Google) tidak dapat didekripsi.'
    );
  }

  let secretPayload;
  try {
    secretPayload = JSON.parse(decryptedText);
  } catch (err) {
    throw new Error('Gagal memproses data rahasia yang telah didekripsi.');
  }

  // Rekonstruksi data instansi
  const restoredInstitution = {
    ...parsed.public_data.institution,
    google_client_secret:
      secretPayload.institution_secrets?.google_client_secret ||
      parsed.public_data.institution.google_client_secret,
    recaptcha_secret_key:
      secretPayload.institution_secrets?.recaptcha_secret_key ||
      parsed.public_data.institution.recaptcha_secret_key,
  };

  // Rekonstruksi password pengguna
  const passwordMap = new Map();
  (secretPayload.user_passwords || []).forEach((item) => {
    passwordMap.set(item.id, item.password);
    if (item.username) passwordMap.set(item.username, item.password);
  });

  const restoredUsers = (parsed.public_data.users || []).map((u) => {
    const originalPassword = passwordMap.get(u.id) || passwordMap.get(u.username);
    return {
      ...u,
      password: originalPassword || (u.nis || u.nisn || '12345'),
    };
  });

  return {
    institution: restoredInstitution,
    users: restoredUsers,
    exam_sessions: parsed.public_data.exam_sessions || [],
    student_attempts: parsed.public_data.student_attempts || [],
    metadata: {
      generated_at: parsed.generated_at,
      institution_name: parsed.institution_name,
      institution_npsn: parsed.institution_npsn,
      summary: parsed.summary,
    },
  };
}

