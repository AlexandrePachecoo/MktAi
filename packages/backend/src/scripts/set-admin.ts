import { prisma } from '../lib/prisma';

const ADMIN_EMAIL = 'Pachecoalexandre934@gmail.com';

async function main() {
  const user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

  if (!user) {
    console.log(`Usuário ${ADMIN_EMAIL} não encontrado. Será configurado como admin ao se registrar.`);
    process.exit(0);
  }

  await prisma.user.update({
    where: { email: ADMIN_EMAIL },
    data: { admin: true, plano: 'pro' },
  });

  console.log(`✓ Usuário ${ADMIN_EMAIL} definido como admin com plano pro.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
