const { initDb, seedDefaultData, queryAll, run } = require('./init');

async function seed() {
  await initDb();
  await seedDefaultData();

  const projects = queryAll('SELECT COUNT(*) as count FROM projects');
  if (!projects.length || projects[0].count === 0) {
    run(`INSERT INTO projects (title, description, full_description, technologies, image_url, live_url, github_url, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      'Projeto Alpha', 'Plataforma de gestão empresarial com dashboards em tempo real.',
      'Plataforma completa de gestão empresarial desenvolvida com React e Node.js. Inclui dashboards interativos, relatórios automatizados e sistema de notificações em tempo real.\n\nFuncionalidades:\n- Dashboard com métricas em tempo real\n- Gestão financeira completa\n- RH integrado com controle de ponto\n- Relatórios exportáveis em PDF/Excel\n- Notificações push e email',
      'React, Node.js, PostgreSQL, Socket.io, Docker', '', 'https://example.com/alpha', 'https://github.com/guilherme/projeto-alpha', 1, 1
    ]);

    run(`INSERT INTO projects (title, description, full_description, technologies, image_url, live_url, github_url, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      'Projeto Beta', 'Aplicativo mobile para delivery com rastreamento em tempo real.',
      'Aplicativo mobile para delivery desenvolvido em React Native. Sistema com rastreamento em tempo real, integração com múltiplos meios de pagamento e painel administrativo completo.\n\nFuncionalidades:\n- Rastreamento GPS em tempo real\n- Pagamentos integrados (Pix, cartão)\n- Chat com o entregador\n- Histórico de pedidos\n- Avaliação de entregadores e restaurantes',
      'React Native, Firebase, Stripe, Google Maps API', '', 'https://example.com/beta', 'https://github.com/guilherme/projeto-beta', 1, 2
    ]);

    run(`INSERT INTO projects (title, description, full_description, technologies, image_url, live_url, github_url, featured, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      'Projeto Gamma', 'Sistema de e-commerce com experiência de compra personalizada.',
      'Sistema de e-commerce moderno com recomendações personalizadas baseadas em IA. Oferece busca inteligente, vitrines personalizadas e checkout otimizado.\n\nFuncionalidades:\n- Recomendações por IA\n- Busca inteligente com elasticsearch\n- Checkout em uma página\n- Painel administrativo completo\n- Integração com principais meios de pagamento',
      'Next.js, Python, TensorFlow, Elasticsearch, AWS', '', 'https://example.com/gamma', 'https://github.com/guilherme/projeto-gamma', 0, 3
    ]);
  }

  const skills = queryAll('SELECT COUNT(*) as count FROM skills');
  if (!skills.length || skills[0].count === 0) {
    const skillData = [
      ['JavaScript', 'frontend', 95, 'fab fa-js'],
      ['React', 'frontend', 90, 'fab fa-react'],
      ['Node.js', 'backend', 88, 'fab fa-node-js'],
      ['HTML5', 'frontend', 95, 'fab fa-html5'],
      ['CSS3', 'frontend', 90, 'fab fa-css3-alt'],
      ['TypeScript', 'frontend', 85, 'fas fa-code'],
      ['Python', 'backend', 80, 'fab fa-python'],
      ['PostgreSQL', 'backend', 78, 'fas fa-database'],
      ['Docker', 'devops', 75, 'fab fa-docker'],
      ['Git', 'devops', 90, 'fab fa-git-alt'],
    ];
    for (let i = 0; i < skillData.length; i++) {
      const [name, category, level, icon] = skillData[i];
      run('INSERT INTO skills (name, category, level, icon_class, sort_order) VALUES (?, ?, ?, ?, ?)', [name, category, level, icon, i + 1]);
    }
  }

  console.log('Database seeded successfully!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
