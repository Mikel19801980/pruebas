import { cpSync, rmSync, existsSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { tmpdir } from 'os';

const sourceDir = process.cwd();
const stagingDir = join(tmpdir(), 'imanox_v3_0_corregida_staging');
const desktopZip = 'C:\\Users\\xsara\\Desktop\\plataforma-oficios-v3.0-fase-b-corregida.zip';

console.log('Preparando empaquetado incremental corregido para Plataforma de Oficios v3.0...');

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

// Asegurar que no se copia ningún secreto
if (existsSync(join(stagingDir, '.env.local'))) {
  rmSync(join(stagingDir, '.env.local'), { force: true });
  console.log('Asegurado: .env.local eliminado de la distribución.');
}

// Comprimir usando PowerShell Compress-Archive
console.log(`Comprimiendo archivo ZIP a ${desktopZip}...`);
const psCommand = `powershell -NoProfile -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${desktopZip}' -Force"`;
execSync(psCommand, { stdio: 'inherit' });

// Limpiar staging
rmSync(stagingDir, { recursive: true, force: true });

console.log(`\nPaquete ZIP incremental corregido generado con éxito en:\n- ${desktopZip}`);
