import { cpSync, rmSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';

const sourceDir = process.cwd();
const stagingDir = join(tmpdir(), 'imanox_v2_1_staging');
const desktopZip = 'C:\\Users\\xsara\\Desktop\\imanox-reformas-v2.1-estable.zip';

console.log('Preparando empaquetado para v2.1...');

if (existsSync(stagingDir)) {
  rmSync(stagingDir, { recursive: true, force: true });
}
mkdirSync(stagingDir, { recursive: true });

const filesToCopy = [
  'src',
  'public',
  'scripts',
  'supabase_schema.sql',
  'INSTRUCCIONES_INSTALACION.md',
  'README.md',
  'AGENTS.md',
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next.config.ts',
  'eslint.config.mjs',
  'postcss.config.mjs',
  'components.json',
  '.env.example',
  '.gitignore'
];

for (const item of filesToCopy) {
  const src = join(sourceDir, item);
  const dest = join(stagingDir, item);
  if (existsSync(src)) {
    cpSync(src, dest, { recursive: true });
    console.log(`Copiado: ${item}`);
  }
}

// Comprimir usando PowerShell Compress-Archive
console.log(`Comprimiendo archivo ZIP a ${desktopZip}...`);
const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${desktopZip}' -Force"`;
execSync(psCommand, { stdio: 'inherit' });

// Limpiar staging
rmSync(stagingDir, { recursive: true, force: true });

console.log(`\nPaquete ZIP v2.1 generado con éxito en:\n- ${desktopZip}`);

