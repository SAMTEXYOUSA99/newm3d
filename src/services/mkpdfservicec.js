const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const base64Img = require('base64-img');

async function generatePDF(mvpproposal) {
    let browser;

    try {
        browser = await puppeteer.launch({
            headless: true,
            timeout: 60000,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        });

        const page = await browser.newPage();

        // Caminho de páginas
        const coverPath = path.join(__dirname, '../../pdfpublic/modelc/capa.html');
        //const companyPath = path.join(__dirname, '../../pdfpublic/modelc/company.html');
        const port1Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio1.html');
        const port2Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio2.html');
        const port3Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio3.html');
        const port4Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio4.html');
        const port5Path = path.join(__dirname, '../../pdfpublic/modelc/portfolio5.html');
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
        const imgPortC04Path = path.join(__dirname, '../../pdfpublic/images/portfolioc04.jpg');
        const imgPortC05Path = path.join(__dirname, '../../pdfpublic/images/portfolioc05.png');
        const finalImgPath = path.join(__dirname, '../../pdfpublic/images/final.png');

        // Leitura de páginas
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

        const priceparc = mvpproposal.projectPrice / 2;

        // imagens base64
        const logocolor = base64Img.base64Sync(logoPath);
        const logohorizontal = base64Img.base64Sync(logoHorizontalPath);

        const portc01 = port1.replace('src="portc01"', `src="${base64Img.base64Sync(imgPortC01Path)}"`);
        const portc02 = port2.replace('src="portc02"', `src="${base64Img.base64Sync(imgPortC02Path)}"`);
        const portc03 = port3.replace('src="portc03"', `src="${base64Img.base64Sync(imgPortC03Path)}"`);
        const portc04 = port4.replace('src="portc04"', `src="${base64Img.base64Sync(imgPortC04Path)}"`);
        const portc05 = port5.replace('src="portc05"', `src="${base64Img.base64Sync(imgPortC05Path)}"`);
        const finalImg = final.replace('src="final"', `src="${base64Img.base64Sync(finalImgPath)}"`);

        const coverWithImages = cover
            .replace('src="logocolorcover"', `src="${logocolor}"`)
            .replace('{{currentDate}}', mvpproposal.currentDate);

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

        await page.setContent(combinedHTML, {
            waitUntil: 'domcontentloaded'
        });

        const buffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            landscape: true
        });

        await browser.close();

        console.log('PDF generated successfully');

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