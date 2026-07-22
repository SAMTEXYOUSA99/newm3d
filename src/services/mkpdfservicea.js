const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { pathToFileURL } = require('url');

async function generatePDF(mvpproposal) {
    let browser;

    try {
        const possibleExecutables = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        ].filter(Boolean);

        let executablePath;
        for (const candidate of possibleExecutables) {
            try {
                if (fs.existsSync(candidate)) {
                    executablePath = candidate;
                    break;
                }
            } catch (err) {
                // ignore invalid path checks
            }
        }

        const launchOptions = {
            headless: true,
            timeout: 300000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        };

        if (executablePath) {
            launchOptions.executablePath = executablePath;
            console.log('Using browser executable:', executablePath);
        } else {
            console.warn('No Chrome/Edge executable found on common paths. Puppeteer may still work if bundled Chromium is available.');
        }

        browser = await puppeteer.launch(launchOptions);
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(300000);
        page.setDefaultTimeout(300000);

        // Caminho de páginas
        const coverPath = path.join(__dirname, '../../pdfpublic/modelc/capa.html');
        const port1Path = path.join(__dirname, '../../pdfpublic/modela/portfolio1.html');
        const port2Path = path.join(__dirname, '../../pdfpublic/modela/portfolio2.html');
        const port3Path = path.join(__dirname, '../../pdfpublic/modela/portfolio3.html');
        const port4Path = path.join(__dirname, '../../pdfpublic/modela/portfolio4.html');
        const port5Path = path.join(__dirname, '../../pdfpublic/modela/portfolio5.html');
        const stepsPath = path.join(__dirname, '../../pdfpublic/modela/steps.html');
        const details01Path = path.join(__dirname, '../../pdfpublic/modelc/details01.html');
        const details02Path = path.join(__dirname, '../../pdfpublic/modelc/details02.html');
        const details03Path = path.join(__dirname, '../../pdfpublic/modelc/details03.html');
        const details04Path = path.join(__dirname, '../../pdfpublic/modelc/details04.html');
        const finalPath = path.join(__dirname, '../../pdfpublic/modelc/final.html');

        // Caminho de imagens
        const logoPath = path.join(__dirname, '../../pdfpublic/images/logocolor.png');
        const logoHorizontalPath = path.join(__dirname, '../../pdfpublic/images/logocolorhorizontal.png');
        const imgPortA01Path = path.join(__dirname, '../../pdfpublic/images/modela/portfolioa01.png');
        const imgPortA02Path = path.join(__dirname, '../../pdfpublic/images/modela/portfolioa02.png');
        const imgPortA03Path = path.join(__dirname, '../../pdfpublic/images/modela/portfolioa03.png');
        const imgPortA04Path = path.join(__dirname, '../../pdfpublic/images/modela/portfolioa04.png');
        const imgPortA05Path = path.join(__dirname, '../../pdfpublic/images/modela/portfolioa05.png');
        const finalImgPath = path.join(__dirname, '../../pdfpublic/images/final.png');

        // Leitura de páginas
        const cover = fs.readFileSync(coverPath, 'utf8');
        const port1 = fs.readFileSync(port1Path, 'utf8');
        const port2 = fs.readFileSync(port2Path, 'utf8');
        const port3 = fs.readFileSync(port3Path, 'utf8');
        const port4 = fs.readFileSync(port4Path, 'utf8');
        const port5 = fs.readFileSync(port5Path, 'utf8');
        const steps = fs.readFileSync(stepsPath, 'utf8');
        let details01 = fs.readFileSync(details01Path, 'utf8');
        let details02 = fs.readFileSync(details02Path, 'utf8');
        let details03 = fs.readFileSync(details03Path, 'utf8');
        let details04 = fs.readFileSync(details04Path, 'utf8');
        const final = fs.readFileSync(finalPath, 'utf8');

        const priceparc = mvpproposal.projectPrice / 2;
        console.log('data:', mvpproposal.currentDate);

        // Use file URLs for images to avoid embedding large Base64 blobs
        const logocolorUrl = pathToFileURL(logoPath).href;
        const logocolorhorizontalUrl = pathToFileURL(logoHorizontalPath).href;
        const imgPorta01Url = pathToFileURL(imgPortA01Path).href;
        const imgPorta02Url = pathToFileURL(imgPortA02Path).href;
        const imgPorta03Url = pathToFileURL(imgPortA03Path).href;
        const imgPorta04Url = pathToFileURL(imgPortA04Path).href;
        const imgPorta05Url = pathToFileURL(imgPortA05Path).href;
        const finalImgUrl = pathToFileURL(finalImgPath).href;

        const coverWithImages = cover
            .replace('src="logocolorcover"', `src="${logocolorUrl}"`)
            .replace('{{currentDate}}', mvpproposal.currentDate);

        let servicesList = '';
        if (Array.isArray(mvpproposal.services)) {
            const startIndex = mvpproposal.projectModelFirst === '' || mvpproposal.projectModelSecond === '' ? 2 : 3;
            servicesList = mvpproposal.services.map((service, index) => `<li>${index + startIndex}. ${service}</li>`).join('');
        }

        details01 = details01.replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{projectModelFirst}}', mvpproposal.projectModelFirst)
            .replace('src="logocolorhorizontal"', `src="${logocolorhorizontalUrl}"`);

        details02 = details02.replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{projectModelSecond}}', mvpproposal.projectModelSecond)
            .replace('src="logocolorhorizontal"', `src="${logocolorhorizontalUrl}"`);

        details03 = details03.replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{projectServices}}', servicesList)
            .replace('src="logocolorhorizontal"', `src="${logocolorhorizontalUrl}"`);

        details04 = details04.replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{priceparc}}', priceparc)
            .replace('src="logocolorhorizontal"', `src="${logocolorhorizontalUrl}"`);

        const porta01 = port1.replace('src="porta01"', `src="${imgPorta01Url}"`);
        const porta02 = port2.replace('src="porta02"', `src="${imgPorta02Url}"`);
        const porta03 = port3.replace('src="porta03"', `src="${imgPorta03Url}"`);
        const porta04 = port4.replace('src="porta04"', `src="${imgPorta04Url}"`);
        const porta05 = port5.replace('src="porta05"', `src="${imgPorta05Url}"`);
        const finalImg = final.replace('src="final"', `src="${finalImgUrl}"`);

        const hasFirst = mvpproposal.projectModelFirst !== '';
        const hasSecond = mvpproposal.projectModelSecond !== '';

        if (!hasFirst && !hasSecond) {
            throw new Error('Nenhum modelo de projeto informado');
        }

        let combinedHTML;
        if (!hasFirst && hasSecond) {
            combinedHTML = coverWithImages + porta01 + porta02 + porta03 + porta04 + porta05 + details02 + details03 + details04 + finalImg;
            console.log('Project Model First vazio');
        } else if (hasFirst && !hasSecond) {
            combinedHTML = coverWithImages + porta01 + porta02 + porta03 + porta04 + porta05 + details01 + details03 + details04 + finalImg;
            console.log('Project Model Second vazio');
        } else {
            combinedHTML = coverWithImages + porta01 + porta02 + porta03 + porta04 + porta05 + details01 + details02 + details03 + details04 + finalImg;
            console.log('Todos preenchidos');
        }

        // Do not embed fonts as Base64 to avoid long waits; use browser/system fonts.
        combinedHTML = combinedHTML.replace('{{FONT}}', '');

        // Write combined HTML to a temporary file and navigate to it using file://
        const tmpDir = path.join(__dirname, '../../pdfpublic/tmp');
        try { fs.mkdirSync(tmpDir, { recursive: true }); } catch (e) {}
        const tmpFile = path.join(tmpDir, `proposal_${Date.now()}.html`);
        fs.writeFileSync(tmpFile, combinedHTML, 'utf8');

        const fileUrl = pathToFileURL(tmpFile).href;
        await page.goto(fileUrl, { waitUntil: 'domcontentloaded', timeout: 120000 });

        const buffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            landscape: true,
            preferCSSPageSize: true,
            margin: {
                top: '0mm',
                right: '0mm',
                bottom: '0mm',
                left: '0mm'
            }
        });

        // remove temp file
        try { fs.unlinkSync(tmpFile); } catch (e) {}
        await browser.close();
        console.log('PDF generated successfully');
        return buffer;
    } catch (error) {
        console.error('Error generating PDF:', error);
        if (browser) {
            try {
                await browser.close();
            } catch (closeErr) {
                console.error('Error closing browser:', closeErr);
            }
        }
        throw new Error('Error generating PDF');
    }
}

module.exports = {
    generatePDF
};
