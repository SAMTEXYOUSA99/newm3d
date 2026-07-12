const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const base64Img = require('base64-img');

async function generatePDF(mvpproposal) {
    let browser;

    try {
        const totalStart = process.hrtime.bigint();

        function formatDurationMs(durationMs) {
            const minutes = Math.floor(durationMs / 60000);
            const seconds = Math.floor((durationMs % 60000) / 1000);
            const milliseconds = Math.floor(durationMs % 1000);
            return `${minutes}m ${seconds}s ${milliseconds}ms`;
        }

        // try to locate a local Chrome/Edge executable to avoid the "Could not find Chrome" error
        const possibleExecutables = [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        ].filter(Boolean);

        let executablePath;
        for (const p of possibleExecutables) {
            try {
                if (fs.existsSync(p)) {
                    executablePath = p;
                    break;
                }
            } catch (e) {
                // ignore
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
            console.warn('No Chrome/Edge executable found on common paths. If you see a "Could not find Chrome" error, install Chromium for puppeteer or set PUPPETEER_EXECUTABLE_PATH env var.');
        }

        const launchStart = process.hrtime.bigint();
        browser = await puppeteer.launch(launchOptions);
        const launchEnd = process.hrtime.bigint();
        console.log('TIMER - browser.launch:', formatDurationMs(Number(launchEnd - launchStart) / 1e6));

        const newPageStart = process.hrtime.bigint();
        const page = await browser.newPage();
        const newPageEnd = process.hrtime.bigint();
        console.log('TIMER - browser.newPage:', formatDurationMs(Number(newPageEnd - newPageStart) / 1e6));
        // increase page timeouts to 5 minutes to allow large/slow PDF generation
        page.setDefaultNavigationTimeout(300000);
        page.setDefaultTimeout(300000);

        // Caminho de páginas
        const coverPath = path.join(__dirname, '../../pdfpublic/modelc/capa.html');
        //const companyPath = path.join(__dirname, '../../pdfpublic/modelc/company.html');
        const port1Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio1.html');
        const port2Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio2.html');
        const port3Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio3.html');
        const port4Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio4.html');
        const port5Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio5.html');
        const port6Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio6.html');
        const details01Path = path.join(__dirname, '../../pdfpublic/modelc/details01.html');
        const details02Path = path.join(__dirname, '../../pdfpublic/modelc/details02.html');
        const details03Path = path.join(__dirname, '../../pdfpublic/modelc/details03.html');
        const details04Path = path.join(__dirname, '../../pdfpublic/modelc/details04.html');
        const finalPath = path.join(__dirname, '../../pdfpublic/modelc/final.html');

        // Caminho de imagens
        const logoPath = path.join(__dirname, '../../pdfpublic/images/logocolor.png');
        const logoHorizontalPath = path.join(__dirname, '../../pdfpublic/images/logocolorhorizontal.png');
        const imgPortC01Path = path.join(__dirname, '../../pdfpublic/images/portfolioc01.png');
        const imgPortC02Path = path.join(__dirname, '../../pdfpublic/images/portfolioc02.png');
        const imgPortC03Path = path.join(__dirname, '../../pdfpublic/images/portfolioc03.png');
        const imgPortC04Path = path.join(__dirname, '../../pdfpublic/images/portfolioc04.png');
        const imgPortC05Path = path.join(__dirname, '../../pdfpublic/images/portfolioc05.png');
        // Reuse existing image for portfolio6 if a dedicated image isn't provided
        const finalImgPath = path.join(__dirname, '../../pdfpublic/images/final.png');

        // Leitura de páginas
        const readPagesStart = process.hrtime.bigint();
        let cover = fs.readFileSync(coverPath, 'utf8');
        //let company = fs.readFileSync(companyPath, 'utf8');
        let port1 = fs.readFileSync(port1Path, 'utf8');
        let port2 = fs.readFileSync(port2Path, 'utf8');
        let port3 = fs.readFileSync(port3Path, 'utf8');
        let port4 = fs.readFileSync(port4Path, 'utf8');
        let port5 = fs.readFileSync(port5Path, 'utf8');
        let details01 = fs.readFileSync(details01Path, 'utf8');
        let details02 = fs.readFileSync(details02Path, 'utf8');
        let details03 = fs.readFileSync(details03Path, 'utf8');
        let details04 = fs.readFileSync(details04Path, 'utf8');
        let final = fs.readFileSync(finalPath, 'utf8');
        const readPagesEnd = process.hrtime.bigint();
        console.log('TIMER - read template files:', formatDurationMs(Number(readPagesEnd - readPagesStart) / 1e6));

        const priceparc = mvpproposal.projectPrice / 2;

        // imagens base64 (measuring each conversion)
        const encodeStart = process.hrtime.bigint();
        const encStart_logo = process.hrtime.bigint();
        const logocolor = base64Img.base64Sync(logoPath);
        const encEnd_logo = process.hrtime.bigint();
        console.log('TIMER - encode logo:', formatDurationMs(Number(encEnd_logo - encStart_logo) / 1e6));

        const encStart_logoh = process.hrtime.bigint();
        const logohorizontal = base64Img.base64Sync(logoHorizontalPath);
        const encEnd_logoh = process.hrtime.bigint();
        console.log('TIMER - encode logoHorizontal:', formatDurationMs(Number(encEnd_logoh - encStart_logoh) / 1e6));

        const encStart_p1 = process.hrtime.bigint();
        const p1Img = base64Img.base64Sync(imgPortC01Path);
        const encEnd_p1 = process.hrtime.bigint();
        console.log('TIMER - encode portc01:', formatDurationMs(Number(encEnd_p1 - encStart_p1) / 1e6));

        const encStart_p2 = process.hrtime.bigint();
        const p2Img = base64Img.base64Sync(imgPortC02Path);
        const encEnd_p2 = process.hrtime.bigint();
        console.log('TIMER - encode portc02:', formatDurationMs(Number(encEnd_p2 - encStart_p2) / 1e6));

        const encStart_p3 = process.hrtime.bigint();
        const p3Img = base64Img.base64Sync(imgPortC03Path);
        const encEnd_p3 = process.hrtime.bigint();
        console.log('TIMER - encode portc03:', formatDurationMs(Number(encEnd_p3 - encStart_p3) / 1e6));

        const encStart_p4 = process.hrtime.bigint();
        const p4Img = base64Img.base64Sync(imgPortC04Path);
        const encEnd_p4 = process.hrtime.bigint();
        console.log('TIMER - encode portc04:', formatDurationMs(Number(encEnd_p4 - encStart_p4) / 1e6));

        const encStart_p5 = process.hrtime.bigint();
        const p5Img = base64Img.base64Sync(imgPortC05Path);
        const encEnd_p5 = process.hrtime.bigint();
        console.log('TIMER - encode portc05:', formatDurationMs(Number(encEnd_p5 - encStart_p5) / 1e6));

        const encStart_final = process.hrtime.bigint();
        const finalImgB64 = base64Img.base64Sync(finalImgPath);
        const encEnd_final = process.hrtime.bigint();
        console.log('TIMER - encode finalImg:', formatDurationMs(Number(encEnd_final - encStart_final) / 1e6));

        const encodeEnd = process.hrtime.bigint();
        console.log('TIMER - total image encoding:', formatDurationMs(Number(encodeEnd - encodeStart) / 1e6));

        const portc01 = port1.replace('src="portc01"', `src="${p1Img}"`);
        const portc02 = port2.replace('src="portc02"', `src="${p2Img}"`);
        const portc03 = port3.replace('src="portc03"', `src="${p3Img}"`);
        const portc04 = port4.replace('src="portc04"', `src="${p4Img}"`);
        const portc05 = port5.replace('src="portc05"', `src="${p5Img}"`);
        const finalImg = final.replace('src="final"', `src="${finalImgB64}"`);

        const coverWithImages = cover
            .replace('src="logocolorcover"', `src="${logocolor}"`)
            .replace('{{currentDate}}', mvpproposal.currentDate);

        // measure template replacement / assembly
        const assembleStart = process.hrtime.bigint();

        const details01Final = details01
            .replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{projectModelFirst}}', mvpproposal.projectModelFirst)
            .replace('src="logocolorhorizontal"', `src="${logohorizontal}"`);

        const details02Final = details02
            .replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{projectModelSecond}}', mvpproposal.projectModelSecond)
            .replace('src="logocolorhorizontal"', `src="${logohorizontal}"`);

        const servicesList = mvpproposal.services
            ? mvpproposal.services.map((s, i) => `<li>${i + 1}. ${s}</li>`).join('')
            : '';

        const details03Final = details03
            .replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{projectServices}}', servicesList)
            .replace('src="logocolorhorizontal"', `src="${logohorizontal}"`);

        const details04Final = details04
            .replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{priceparc}}', priceparc)
            .replace('src="logocolorhorizontal"', `src="${logohorizontal}"`);

        const assembleEnd = process.hrtime.bigint();
        console.log('TIMER - assemble templates:', formatDurationMs(Number(assembleEnd - assembleStart) / 1e6));

        let combinedHTML;

        const hasFirst = mvpproposal.projectModelFirst !== '';
        const hasSecond = mvpproposal.projectModelSecond !== '';

        if (!hasFirst && !hasSecond) {
            throw new Error('Nenhum modelo de projeto informado');
        }

        if (!hasFirst && hasSecond) {
            combinedHTML =
                coverWithImages +
                //company +
                portc01 + portc02 + portc03 + portc04 + portc05 +
                details02Final + details03Final + details04Final +
                finalImg;

        } else if (hasFirst && !hasSecond) {
            combinedHTML =
                coverWithImages +
                //company +
                portc01 + portc02 + portc03 + portc04 + portc05 +
                details01Final + details03Final + details04Final +
                finalImg;

        } else {
            combinedHTML =
                coverWithImages +
                //company +
                portc01 + portc02 + portc03 + portc04 + portc05 +
                details01Final + details02Final + details03Final + details04Final +
                finalImg;
        }

        // start timer for PDF generation (content render + pdf creation)
        const startTime = process.hrtime.bigint();

        const setContentStart = process.hrtime.bigint();
        await page.setContent(combinedHTML, {
           /* waitUntil: 'domcontentloaded'*/
            waitUntil: 'networkidle0'
        });
        await page.evaluate(async () => {
            await document.fonts.ready;
        });
        const fonts = await page.evaluate(() =>
            [...document.fonts].map(f => ({
                family: f.family,
                status: f.status
            }))
        );

        console.log('fontes:', fonts);
        const setContentEnd = process.hrtime.bigint();
        console.log('TIMER - page.setContent:', formatDurationMs(Number(setContentEnd - setContentStart) / 1e6));

        const pdfStart = process.hrtime.bigint();
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
        const pdfEnd = process.hrtime.bigint();
        console.log('TIMER - page.pdf:', formatDurationMs(Number(pdfEnd - pdfStart) / 1e6));

        await browser.close();

        const endTime = process.hrtime.bigint();
        const durationMs = Number(endTime - startTime) / 1e6; // milliseconds
        console.log(`pdf geneterad.. - took ${formatDurationMs(durationMs)}`);

        const totalEnd = process.hrtime.bigint();
        console.log('TIMER - total generatePDF:', formatDurationMs(Number(totalEnd - totalStart) / 1e6));

        return buffer;

    } catch (error) {
        console.error('Error generating PDF:', error);

        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                console.error('Error closing browser:', e);
            }
        }

        throw new Error('Error generating PDF');
    }
}

module.exports = {
    generatePDF
};