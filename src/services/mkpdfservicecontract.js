const fs = require('fs');
const puppeteer = require('puppeteer');

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function findExecutablePath() {
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
  ].filter(Boolean);
  return candidates.find(p => { try { return fs.existsSync(p); } catch (e) { return false; } });
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatDateExtenso(date) {
  const d = date instanceof Date
    ? date
    : /^\d{4}-\d{2}-\d{2}$/.test(String(date))
      ? new Date(`${date}T12:00:00`)
      : new Date(date);
  return `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatDateNumeric(date) {
  const value = String(date || '');
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('pt-BR');
}

function getModelingService(projectModel) {
  const value = String(projectModel || '').toLowerCase();
  if (!value.includes('model') && !value.includes('extern') && !value.includes('intern')) return null;
  const hasInternal = value.includes('intern');
  const hasExternal = value.includes('extern');
  const direction = hasInternal && hasExternal ? 'interna/externa' : hasInternal ? 'interna' : 'externa';
  return {
    title: `Modelagem 3D ${direction}`,
    listTitle: `Modelagem 3D ${direction === 'interna/externa' ? 'interno/externo' : direction === 'interna' ? 'interno' : 'externo'}`,
    subitems: [
      'Paredes internas/externas (conforme medidas/croqui recebidas pelo cliente)',
      'Terreno',
      'Cenografia e decoração básica, conforme instruções do cliente',
      'Muros',
      'Pátio completo, com todos as áreas previstas no projeto arquitetônico e vídeos/fotos do local',
      'Acessos',
      'Paisagismo básico genérico',
      'Humanização'
    ]
  };
}

function formatDeadline(value) {
  const text = String(value ?? '').trim();
  return /^\d+$/.test(text) ? text.padStart(2, '0') : text;
}

function getContractFilename(contract) {
  const clientName = contract.contractant?.companyName || contract.contractant?.fullName || 'Cliente';
  const projectName = contract.proposalSnapshot?.title || 'Projeto';
  return `Contrato de Prestação de Serviços - ${clientName} - ${projectName} - M3D STUDIO HOME.pdf`;
}

// PJ contracts identify the company (name + CNPJ); PF contracts identify the individual (name + CPF).
function buildContractantParagraph(c) {
  const address = escapeHtml(c.address || '');
  const cityState = c.cityState ? `, ${escapeHtml(c.cityState)}` : '';
  if (c.companyName && c.cnpj) {
    return `<strong>${escapeHtml(c.companyName)}</strong>, inscrito no CNPJ sob o nº <strong>${escapeHtml(c.cnpj)}</strong>, com sede na ${address}${cityState}, doravante denominado simplesmente <strong>CONTRATANTE</strong>`;
  }
  return `<strong>${escapeHtml(c.fullName)}</strong>, inscrito no CPF sob o nº <strong>${escapeHtml(c.cpf || '')}</strong>, residente e domiciliado na ${address}${cityState}, doravante denominado(a) <strong>CONTRATANTE</strong>`;
}

function contractantSignatureLabel(c) {
  return escapeHtml(c.companyName || c.fullName || '');
}

function joinServicesText(titles) {
  if (!titles.length) return 'serviços conforme orçamento aprovado';
  if (titles.length === 1) return titles[0];
  return `${titles.slice(0, -1).join(', ')} e ${titles[titles.length - 1]}`;
}

function buildPaymentClause(contract) {
  const payment = contract.payment || {};
  const totalText = formatCurrency(contract.total);
  const baseEnd = 'ficando estabelecido que o não pagamento exime o CONTRATADO da obrigação de prosseguir com o serviço ou realizar a entrega final do projeto, seja em formato digital ou impresso.';

  if (payment.method === 'avista') {
    return `Pelo serviço prestado, o CONTRATANTE pagará ao CONTRATADO a quantia total de ${totalText}, à vista, mediante pagamento na assinatura do presente contrato, ${baseEnd}`;
  }

  if (payment.method === 'pix') {
    const entryText = formatCurrency(payment.pixEntry);
    const remainingText = formatCurrency(payment.pixRemaining);
    const entryDueDate = formatDateNumeric(payment.dueDate) || 'na data de assinatura do contrato';
    const installment2Part = payment.pixInstallment2 != null
      ? ` o valor de ${formatCurrency(payment.pixInstallment2)} pago em parcela intermediária, e`
      : ' e';
    return `Pelo serviço prestado, o CONTRATANTE pagará ao CONTRATADO a quantia total de ${totalText} para a execução dos serviços descritos na Cláusula Primeira, sendo o valor de ${entryText}, pago a título de entrada no dia ${entryDueDate},${installment2Part} o restante, no valor de ${remainingText}, a ser pago quando os materiais finais do projeto estiverem concluídos, ${baseEnd}`;
  }

  const installmentsText = payment.installments ? `em até ${escapeHtml(String(payment.installments))}x` : 'conforme condições da operadora do cartão';
  return `Pelo serviço prestado, o CONTRATANTE pagará ao CONTRATADO a quantia total de ${totalText} para a execução dos serviços descritos na Cláusula Primeira, através de cartão de crédito, podendo ser parcelado ${installmentsText}, ${baseEnd}`;
}

// NOTE: legal clauses (2, 3, 4, 6, 7, 8, 9) and the M3D/CONTRATADO block are fixed boilerplate provided by the studio.
function buildHtml(contract) {
  const c = contract.contractant || {};
  const snapshot = contract.proposalSnapshot || {};
  const services = snapshot.services || [];
  const payment = contract.payment || {};
  const modelingSource = snapshot.projectModel || contract.projectModel || services.find(service => {
    const serviceId = String(service.id || '').toLowerCase();
    const serviceTitle = String(service.title || '').toLowerCase();
    return serviceId === 'project-model' || serviceTitle.includes('modelagem') || serviceTitle.includes('modeling');
  })?.title;
  const modelingService = getModelingService(modelingSource);
  const serviceTitles = services
    .filter(service => !modelingService || String(service.id || '').toLowerCase() !== 'project-model')
    .map(s => s.title)
    .filter(Boolean);
  const revisionService = 'Revisão: Incluso 02 revisão/ajustes em projeto 3D anterior às renderizações de vídeo, de cada projeto';
  const modelingListTitle = modelingService
    ? `${modelingService.listTitle}, conforme projeto e necessidades do cliente`
    : '';
  const contractServices = [
    ...(modelingService ? [modelingListTitle] : []),
    ...serviceTitles,
    revisionService
  ];

  const objectServiceTitles = [
    ...(modelingService ? [modelingService.title] : []),
    ...serviceTitles
  ];
  const objectServicesText = joinServicesText(objectServiceTitles);
  const servicesListItems = contractServices.map((title, idx) => {
    const modelingSubitems = modelingService && idx === 0
      ? `<ol>${modelingService.subitems.map((item, subidx) => `<li>${idx + 1}.${subidx + 1} - ${escapeHtml(item)};</li>`).join('')}</ol>`
      : '';
    return `<li><strong>${idx + 1}. ${escapeHtml(title)};</strong>${modelingSubitems}</li>`;
  }).join('');

  const dueDateText = payment.dueDate ? formatDateExtenso(payment.dueDate) : 'na data de assinatura deste contrato';
  const projectDeadline = formatDeadline(contract.projectDeadline);
  const signatureDate = formatDateExtenso(payment.dueDate || new Date());

  return `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(getContractFilename(contract))}</title>
    <style>
      body { font-family: 'Times New Roman', serif; color: #111; padding: 48px; font-size: 20px; line-height: 2; }
      h1 { font-size: 20px; text-align: left; text-decoration: underline; margin-bottom: 100px; }
      h2 { font-size: 21px; margin-top: 22px; margin-bottom: 8px; text-transform: uppercase; }
      h2.clause-break { margin-top: 112.5px; }
      p { margin: 0 0 25px; text-align: justify; }
      p.clause-break { margin-top: 60px; }
      .section-break { margin-top: 112.5px; }
      .client-services-break { margin-top: 900px; }
      ul { margin: 8px 0 14px; padding-left: 0; list-style: none; }
      li { margin-bottom: 50px; }
      li li { margin-bottom: 0; }
      ol { margin: 0; padding-left: 0; list-style: none; }
      .signatures { margin-top: 175px; }
      .sign-line { margin-top: 0; border-top: 1px solid #111; width: 340px; padding-top: 4px; }
      .sign-line + .sign-line { margin-top: 175px; }
    </style>
  </head>
  <body>
    <h1>Contrato de Prestação de Serviços | M PROJETO 3D | M3D STUDIO HOME</h1>

    <p>Pelo presente instrumento particular, de um lado</p>

    <p><strong>Mateus Soares Teixeira</strong>, inscrito no CPF sob o nº 033.849.210-03, representando a empresa de nome fantasia M PROJETO 3D, microempresário individual, inscrita no CNPJ sob o n.º 46.393.667/0001-00, com sede em Santa Cruz do Sul, Rua Professor Simão H A. Campis, 1844, neste ato representada, conforme poderes especialmente, por MATEUS SOARES TEIXEIRA, portador do CPF inscrito sob o nº 033.849.210-03 e RG inscrito sob o nº 3117479265, expedido por SSP-RS, doravante denominado (a) <strong>CONTRATADO</strong> (A);</p>

    <p>E</p>

    <p>${buildContractantParagraph(c)}.</p>

    <p class="client-services-break">As partes acima identificadas têm, entre si, justo e acertado o presente Contrato para o desenvolvimento de projeto de <strong>${escapeHtml(objectServicesText)}, e revisão do projeto, sendo o seguinte projeto: ${escapeHtml(snapshot.title || '')}, conforme instruções e detalhes previamente recebidos pela conversa de WhatsApp</strong>, que se regerá pelas cláusulas seguintes e pelas condições descritas no presente.</p>

    <h2>Do objeto do contrato</h2>
    <p>Cláusula 1ª. O presente contrato tem como OBJETO, o desenvolvimento, pelo CONTRATADO, do projeto abaixo descrito, valendo-se da melhor técnica disponível pelo CONTRATADO:</p>
    <ul>${servicesListItems}</ul>

    <h2 class="section-break">Da execução</h2>
    <p>Cláusula 2ª. O CONTRATADO se obriga a apresentar o projeto em 2D ou 3D para prévia aprovação do CONTRATANTE no prazo de <strong>${escapeHtml(projectDeadline)} dias úteis</strong>, se estendendo em até mais 7 dias úteis para as devidas alterações desejadas pelo CONTRATANTE. O presente contrato possibilita até no máximo 2 alterações de projeto, após a primeira apresentação, sendo cada alteração de no máximo 30% do projeto já desenvolvido. O desenvolvimento será feito em conjunto com o cliente, apresentando prévias básicas, diariamente, conforme o avanço nas modelagens 3D básicas. O projeto seguirá desde o início com o briefing combinado com o CONTRATANTE, e mudanças de projeto que possam extrapolar o briefing deverão ser combinadas e poderão acarretar em novos custos para o CONTRATANTE.</p>

    <p class="section-break">Cláusula 3ª. A construção do projeto será feita pessoalmente pelo CONTRATADO, facultando-lhe a contratação de ajudantes, os quais terão vínculo único e direto com o mesmo, que ficará exclusivamente responsável pelo pagamento e todos os encargos existentes.</p>

    <p class="section-break">Cláusula 4ª. O CONTRATADO terá completa e irrestrita liberdade para executar seu trabalho, não necessitando de predeterminar horários ou funções, ficando assim, caracterizado, que o mesmo exerce de maneira autônoma seus serviços, não mantendo nenhum vínculo trabalhista com o CONTRATANTE.</p>

    <h2 class="section-break">Do pagamento</h2>
    <p><strong>Cláusula 5ª. </strong>${buildPaymentClause(contract)}</p>

    <p>5.2. O pagamento da entrada deverá ser realizado através de link de pagamento de PIX ou com a chave da empresa descrita abaixo, sendo a primeira parcela para vencimento em ${escapeHtml(dueDateText)}. O pagamento final poderá ser feito também através de link de pagamento de cartão de crédito ou através de pix. A chave PIX bancária gerada será em detrimento a ser depositado em conta corrente de titularidade do (a) CONTRATADO (A).</p>

    <p><strong>BANCO: Nu Pagamentos S.A. &nbsp;&nbsp;&nbsp;&nbsp; CONTA CORRENTE: 16981289-9<br/>
    AGÊNCIA: 0001 &nbsp;&nbsp;&nbsp;&nbsp; CHAVE PIX: emeprojeto3d@gmail.com</strong></p>

    <h2 class="section-break">Negativação do contratante</h2>
    <p>Cláusula 6ª. Em caso de inadimplência do CONTRATANTE, ou seja, não pagamento dos valores acordados no prazo estipulado neste contrato, fica desde já acordado entre as partes CONTRATANTES que a CONTRATADA poderá tomar medidas para proteger seu crédito, incluindo a negativação do nome do CONTRATANTE em órgãos de proteção ao crédito, tais como Serasa, SPC, Boa Vista, entre outros.</p>

    <p>6.2. Para fins de registro, a CONTRATADA deverá notificar o CONTRATANTE por escrito, por meio de carta registrada ou outra forma de comunicação eficaz, informando sobre a sua inadimplência e dando um prazo de 10 (dez) dias corridos para a regularização do débito, conforme previsto pelo art. 43, §2º, do Código de Defesa do Consumidor (Lei nº 8.078/90).</p>

    <p>6.3. Caso o CONTRATANTE não regularize o débito no prazo estabelecido na cláusula 6.2 acima, a CONTRATADA fica autorizada a proceder com a negativação do seu nome, conforme previsto pelo art. 43, §2º, do Código de Defesa do Consumidor (Lei nº 8.078/90).</p>

    <p>6.4. Ressalta-se que a negativação do nome do CONTRATANTE não prejudica as demais obrigações previstas neste contrato, especialmente as relativas ao pagamento dos valores em atraso, bem como a aplicação de juros, multas e correção monetária.</p>

    <p>6.5. O CONTRATANTE, ao assinar este contrato, declara estar ciente da possibilidade de negativação do seu nome em caso de inadimplência e concorda com as condições aqui estabelecidas.</p>

    <p>6.6. Esta cláusula é regida pelas legislações brasileiras vigentes, especialmente pelo Código de Defesa do Consumidor (Lei nº 8.078/90) e demais normas aplicáveis.</p>

    <h2 class="section-break">Das limitações de responsabilidade técnica</h2>
    <p>Cláusula 7ª. A CONTRATADA, M3D STUDIO, empresa especializada na criação de projetos 3D, imagens e vídeos com finalidade exclusivamente visual, conceitual e ilustrativa, declara e o CONTRATANTE concorda que:</p>

    <p>7.1 - Natureza dos Serviços: Os materiais desenvolvidos (renders, animações, maquetes eletrônicas e demais entregas) possuem caráter meramente artístico, publicitário e ilustrativo, não se configurando como projetos executivos, arquitetônicos, estruturais, elétricos, hidráulicos, urbanísticos ou de qualquer natureza técnica construtiva.</p>

    <p>7.2 - Ausência de Responsabilidade Técnica: A CONTRATADA não se responsabiliza por: Viabilidade técnica, estrutural ou construtiva de quaisquer elementos representados; Compatibilização de projetos técnicos; Atendimento a normas técnicas, legislações vigentes, códigos de obras ou exigências de órgãos reguladores; Dimensionamentos, cálculos estruturais, instalações elétricas, hidráulicas, sanitárias ou similares; Orçamentos, quantitativos de materiais ou custos de execução; Execução de obras ou serviços derivados das imagens produzidas.</p>

    <p>7.3 - Responsabilidade do Contratante e Terceiros: É de inteira responsabilidade do CONTRATANTE a contratação de profissionais legalmente habilitados (engenheiros, arquitetos e demais técnicos) para: Desenvolvimento de projetos executivos; Validação técnica das soluções apresentadas; Aprovação junto aos órgãos competentes; Execução e acompanhamento de obras.</p>

    <p>7.4 - Fidelidade às Referências Fornecidas: A CONTRATADA se compromete a reproduzir visualmente as informações e referências fornecidas pelo CONTRATANTE, não sendo responsável por eventuais erros, omissões ou inconsistências oriundas desses materiais.</p>

    <p>7.5 - Uso Indevido: Fica expressamente vedada a utilização dos materiais produzidos pela CONTRATADA como base única para execução de obras, projetos técnicos ou qualquer finalidade que exija responsabilidade técnica, isentando a CONTRATADA de quaisquer ônus, danos ou prejuízos decorrentes de tal uso.</p>

    <p>7.6 - Limitação de Responsabilidade Civil: A CONTRATADA não responderá, em hipótese alguma, por danos diretos ou indiretos, prejuízos financeiros, lucros cessantes ou quaisquer consequências decorrentes da utilização dos materiais produzidos para fins distintos de sua finalidade ilustrativa.</p>

    <h2 class="clause-break">Da desistência</h2>
    <p>Cláusula 8ª. Em caso de desistência da criação do projeto após assinatura do contrato pelo CONTRATANTE, ficará a primeira parcela já paga ao CONTRATADO, como honorários pelo trabalho iniciado.</p>

    <p class="clause-break">Cláusula 9ª. Em caso de desistência da criação do projeto após assinatura do contrato pelo CONTRATADO, o mesmo devolverá o valor pago ao CONTRATANTE.</p>

    <p class="section-break">Santa Cruz do Sul, ${signatureDate}.</p>

    <div class="signatures">
      <div class="sign-line">CONTRATANTE - <strong>${contractantSignatureLabel(c)}</strong></div>
      <div class="sign-line">CONTRATADO - <strong>MATEUS SOARES TEIXEIRA | M3D STUDIO HOME</strong></div>
    </div>
  </body>
  </html>`;
}

async function generateContractPDF(contract) {
  const t0 = process.hrtime.bigint();
  const elapsed = () => `${(Number(process.hrtime.bigint() - t0) / 1e6).toFixed(0)}ms`;

  console.log('[mkpdfservicecontract] generateContractPDF start, contract code:', contract && contract.code);
  const executablePath = findExecutablePath();
  console.log('[mkpdfservicecontract] executablePath resolved to:', executablePath || '(none, will use puppeteer bundled chromium)');
  const launchOptions = {
    headless: true,
    timeout: 300000,
    protocolTimeout: 600000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  };
  if (executablePath) launchOptions.executablePath = executablePath;

  console.log('[mkpdfservicecontract] launching browser with options:', launchOptions);
  const browser = await puppeteer.launch(launchOptions);
  console.log(`[mkpdfservicecontract] browser launched (t=${elapsed()})`);
  try {
    console.log('[mkpdfservicecontract] opening new page...');
    const page = await browser.newPage();
    console.log(`[mkpdfservicecontract] new page opened (t=${elapsed()})`);
    // Navigation timeout kept short here on purpose while debugging the hang; raise it back once the cause is confirmed.
    page.setDefaultNavigationTimeout(20000);
    page.setDefaultTimeout(20000);
    page.on('console', msg => console.log('[mkpdfservicecontract][page console]', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('[mkpdfservicecontract][page error]', err));
    page.on('requestfailed', req => console.log('[mkpdfservicecontract][request failed]', req.url(), req.failure()));

    const html = buildHtml(contract);
    console.log('[mkpdfservicecontract] html built, length:', html.length);

    console.log('[mkpdfservicecontract] setting page content (waitUntil: domcontentloaded)...');
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    console.log(`[mkpdfservicecontract] page content set (t=${elapsed()})`);

    console.log('[mkpdfservicecontract] generating pdf buffer...');
    const buffer = await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
    console.log(`[mkpdfservicecontract] pdf buffer generated, bytes: ${buffer.length} (t=${elapsed()})`);
    return buffer;
  } catch (err) {
    console.error(`[mkpdfservicecontract] error during PDF generation (t=${elapsed()}):`, err);
    throw err;
  } finally {
    await browser.close();
    console.log(`[mkpdfservicecontract] browser closed (t=${elapsed()})`);
    console.log('[mkpdfservicecontract] browser closed');
  }
}

module.exports = { generateContractPDF, getContractFilename };
