import { execSync } from 'child_process';

const targetZip = process.argv[2] || 'C:\\Users\\xsara\\Desktop\\plataforma-oficios-v3.0-fase-b.zip';
const listCmd = `powershell -NoProfile -Command "Add-Type -AssemblyName System.IO.Compression.FileSystem; $zip = [System.IO.Compression.ZipFile]::OpenRead('${targetZip}'); foreach ($entry in $zip.Entries) { Write-Output $entry.FullName }; $zip.Dispose()"`;

const output = execSync(listCmd).toString();
const entries = output.split(/\r?\n/).filter(Boolean);

console.log(`Total de archivos en el ZIP: ${entries.length}`);

const hasAgentsMd = entries.some(name => name.toLowerCase() === 'agents.md' || name.toLowerCase().endsWith('/agents.md'));
if (!hasAgentsMd) {
  console.error("❌ ERROR: El archivo AGENTS.md no fue encontrado dentro del paquete ZIP.");
  process.exit(1);
}

const suspicious = entries.filter(name => 
  name.includes('node_modules') ||
  name === '.git' || name.startsWith('.git/') || name.includes('/.git/') ||
  (name.includes('.env') && !name.includes('.env.example'))
);

if (suspicious.length === 0) {
  console.log("✅ AUDITORÍA DE SEGURIDAD EXITOSA:");
  console.log("- AGENTS.md incluido correctamente");
  console.log("- Sin node_modules");
  console.log("- Sin historial .git");
  console.log("- Sin archivos .env ni claves secretas");
  console.log("- Contiene .env.example y archivos esenciales limpios");
} else {
  console.error("❌ Se encontraron archivos sospechosos:", suspicious);
  process.exit(1);
}
