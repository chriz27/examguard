/**
 * Test Node 22 Built-in SQLite
 * Jalankan: node test-node-sqlite.cjs
 */
'use strict';

console.log('Testing Node.js version:', process.version);

let DatabaseSync;
try {
  const sqlite = require('node:sqlite');
  DatabaseSync = sqlite.DatabaseSync;
  console.log('✅ node:sqlite tersedia di Node.js ini!');
} catch (err) {
  console.log('❌ node:sqlite tidak tersedia:', err.message);
  process.exit(1);
}

try {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('CREATE TABLE test (id TEXT PRIMARY KEY, name TEXT);');
  
  const insert = db.prepare('INSERT INTO test (id, name) VALUES (?, ?);');
  insert.run('1', 'ExamGuard');
  
  const select = db.prepare('SELECT * FROM test WHERE id = ?;');
  const row = select.get('1');
  console.log('✅ Insert & Select OK:', row);
  
  console.log('🎉 Node 22 built-in SQLite 100% bekerja tanpa compiler C++!');
} catch (err) {
  console.error('❌ Error saat mengeksekusi SQLite:', err);
}
