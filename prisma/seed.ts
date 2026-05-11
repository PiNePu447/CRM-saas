import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      settings: {},
    },
  });

  const passwordHash = await bcrypt.hash('Admin@123456', 12);

  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.com',
      passwordHash,
      name: 'Admin Demo',
      role: 'ADMIN',
    },
  });

  const seller = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'vendedor@demo.com' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'vendedor@demo.com',
      passwordHash: await bcrypt.hash('Seller@123456', 12),
      name: 'João Vendedor',
      role: 'SELLER',
    },
  });

  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'default-pipeline' },
    update: {},
    create: {
      id: 'default-pipeline',
      tenantId: tenant.id,
      name: 'Vendas',
      isDefault: true,
      stages: {
        create: [
          { name: 'Prospecção', position: 0, probabilityDefault: 10, color: '#6B7280' },
          { name: 'Qualificação', position: 1, probabilityDefault: 25, color: '#3B82F6' },
          { name: 'Proposta', position: 2, probabilityDefault: 50, color: '#F59E0B' },
          { name: 'Negociação', position: 3, probabilityDefault: 75, color: '#8B5CF6' },
          { name: 'Ganho', position: 4, probabilityDefault: 100, color: '#10B981' },
          { name: 'Perdido', position: 5, probabilityDefault: 0, color: '#EF4444' },
        ],
      },
    },
    include: { stages: true },
  });

  const company = await prisma.company.create({
    data: {
      tenantId: tenant.id,
      name: 'Acme Corporation',
      domain: 'acmecorp.com',
      industry: 'Tecnologia',
      size: '51-200',
    },
  });

  const contact = await prisma.contact.create({
    data: {
      tenantId: tenant.id,
      ownerId: seller.id,
      companyId: company.id,
      name: 'Maria Oliveira',
      email: 'maria@acmecorp.com',
      phone: '+55 11 99999-1234',
      status: 'QUALIFIED',
    },
  });

  const prospecStage = pipeline.stages.find((s) => s.name === 'Qualificação')!;

  await prisma.deal.create({
    data: {
      tenantId: tenant.id,
      contactId: contact.id,
      ownerId: seller.id,
      pipelineId: pipeline.id,
      stageId: prospecStage.id,
      title: 'Implementação ERP - Acme Corp',
      value: 45000,
      probability: 60,
      expectedCloseDate: new Date('2026-08-31'),
      position: 1,
    },
  });

  await prisma.task.create({
    data: {
      tenantId: tenant.id,
      assignedTo: seller.id,
      contactId: contact.id,
      title: 'Ligar para Maria amanhã às 14h',
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await prisma.activity.create({
    data: {
      tenantId: tenant.id,
      contactId: contact.id,
      userId: seller.id,
      type: 'CALL',
      content: { body: 'Ligação inicial realizada. Cliente interessado em proposta.' },
    },
  });

  console.log('Seed completed!');
  console.log('Admin: admin@demo.com / Admin@123456');
  console.log('Seller: vendedor@demo.com / Seller@123456');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
