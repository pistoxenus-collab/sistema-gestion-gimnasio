import git from 'isomorphic-git';
import http from 'isomorphic-git/http/node';
import fs from 'fs';

const dir = process.cwd();

async function push() {
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.argv[2];

  if (!token) {
    console.log('\n❌ Error: No se detectó un GitHub Personal Access Token.');
    console.log('👉 Uso:');
    console.log('   $env:GITHUB_TOKEN="tu_token_de_github"; node scripts/git-push.js');
    console.log('   O directamente:');
    console.log('   node scripts/git-push.js <tu_github_token>\n');
    process.exit(1);
  }

  console.log('🚀 Subiendo cambios a https://github.com/pistoxenus-collab/sistema-gestion-gimnasio.git (rama main)...');

  try {
    const result = await git.push({
      fs,
      http,
      dir,
      remote: 'origin',
      ref: 'main',
      force: false,
      onAuth: () => ({ username: token, password: '' }),
    });

    console.log('✅ ¡Éxito! El código ha sido subido a la rama main de GitHub.');
    console.log(result);
  } catch (err) {
    console.error('❌ Error al subir a GitHub:', err.message);
    process.exit(1);
  }
}

push().catch(console.error);
