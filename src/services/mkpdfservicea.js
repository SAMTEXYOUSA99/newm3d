const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const base64Img = require('base64-img');

async function generatePDF(mvpproposal) {
    try {
        const browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
          });
        const page = await browser.newPage();

        // Caminho de páginas
        const coverPath = path.join(__dirname, '../../pdfpublic/modelc/capa.html');
        const companyPath = path.join(__dirname, '../../pdfpublic/modelc/company.html');
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
        const imgPortA02Path = path.join(__dirname, '../../pdfpublic/images/modela/portfolioa02.jpg');
        const imgPortA03Path = path.join(__dirname, '../../pdfpublic/images/modela/portfolioa03.jpg');
        const imgPortA04Path = path.join(__dirname, '../../pdfpublic/images/modela/portfolioa04.jpg');
        const imgPortA05Path = path.join(__dirname, '../../pdfpublic/images/modela/portfolioa05.jpg');
        const finalImgPath = path.join(__dirname, '../../pdfpublic/images/final.png');
        const companyImagePath = path.join(__dirname, '../../pdfpublic/images/companypage.png');

        // Leitura de páginas
        let cover = fs.readFileSync(coverPath, 'utf8');
        let company = fs.readFileSync(companyPath, 'utf8');
        let port1 = fs.readFileSync(port1Path, 'utf-8');
        let port2 = fs.readFileSync(port2Path, 'utf-8');
        let port3 = fs.readFileSync(port3Path, 'utf-8');
        let port4 = fs.readFileSync(port4Path, 'utf-8');
        let port5 = fs.readFileSync(port5Path, 'utf-8');
        let steps = fs.readFileSync(stepsPath, 'utf8');
        let details01 = fs.readFileSync(details01Path, 'utf8');
        let details02 = fs.readFileSync(details02Path, 'utf8');
        let details03 = fs.readFileSync(details03Path, 'utf8');
        let details04 = fs.readFileSync(details04Path, 'utf8');
        let final = fs.readFileSync(finalPath, 'utf8');

        let servicesList;

        const priceparc = mvpproposal.projectPrice / 2;
        console.log(priceparc);

        console.log('data:', mvpproposal.currentDate);

        const logocolorbs64img = base64Img.base64Sync(logoPath);

        // Realize as substituições necessárias no template aqui
        const coverWithImages = cover.replace('src="logocolorcover"', `src="${logocolorbs64img}"`)
            .replace('{{currentDate}}', mvpproposal.currentDate);

        if (mvpproposal.projectModelFirst === '' && mvpproposal.projectModelSecond === '') {
            console.log('Nenhum campo preenchido');
        } else if (mvpproposal.projectModelFirst === '' && mvpproposal.projectModelSecond !== '') {
            servicesList = mvpproposal.services.map((service, index) => `<li>${index + 2}. ${service}</li>`).join('');
        } else if (mvpproposal.projectModelFirst !== '' && mvpproposal.projectModelSecond === '') {
            servicesList = mvpproposal.services.map((service, index) => `<li>${index + 2}. ${service}</li>`).join('');
        } else if (mvpproposal.projectModelFirst !== '' && mvpproposal.projectModelSecond !== '') {
            servicesList = mvpproposal.services.map((service, index) => `<li>${index + 3}. ${service}</li>`).join('');
        } else {
            console.log('Não definido corretamente');
        }

        details01 = details01.replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{projectModelFirst}}', mvpproposal.projectModelFirst);

        details02 = details02.replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{projectModelSecond}}', mvpproposal.projectModelSecond);

        details03 = details03.replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{projectServices}}', servicesList);
        console.log('lista:', servicesList);

        details04 = details04.replace('{{projectName}}', mvpproposal.projectName)
            .replace('{{clientName}}', mvpproposal.clientName)
            .replace('{{projectPrice}}', mvpproposal.projectPrice)
            .replace('{{clientPhone}}', mvpproposal.clientPhone)
            .replace('{{projectDeadline}}', mvpproposal.projectDeadline)
            .replace('{{priceparc}}', priceparc);

        // Converter a imagem para Base64
        const bs64ImgCompanyImg = base64Img.base64Sync(companyImagePath);
        const bs64ImgPorta01 = base64Img.base64Sync(imgPortA01Path);
        const bs64ImgPorta02 = base64Img.base64Sync(imgPortA02Path);
        const bs64ImgPorta03 = base64Img.base64Sync(imgPortA03Path);
        const bs64ImgPorta04 = base64Img.base64Sync(imgPortA04Path);
        const bs64ImgPorta05 = base64Img.base64Sync(imgPortA05Path);
        const bs64FinalImg = base64Img.base64Sync(finalImgPath);

        const logocolorhorizontalbs64img = base64Img.base64Sync(logoHorizontalPath);

        const details01WithLogo = details01.replace('src="logocolorhorizontal"', `src="${logocolorhorizontalbs64img}"`);
        const details02WithLogo = details02.replace('src="logocolorhorizontal"', `src="${logocolorhorizontalbs64img}"`);
        const details03WithLogo = details03.replace('src="logocolorhorizontal"', `src="${logocolorhorizontalbs64img}"`);
        const details04WithLogo = details04.replace('src="logocolorhorizontal"', `src="${logocolorhorizontalbs64img}"`);

        const companyWithImage = company.replace('src="companypage"', `src="${bs64ImgCompanyImg}"`);

        const porta01 = port1.replace('src="porta01"', `src="${bs64ImgPorta01}"`);
        const porta02 = port2.replace('src="porta02"', `src="${bs64ImgPorta02}"`);
        const porta03 = port3.replace('src="porta03"', `src="${bs64ImgPorta03}"`);
        const porta04 = port4.replace('src="porta04"', `src="${bs64ImgPorta04}"`);
        const porta05 = port5.replace('src="porta05"', `src="${bs64ImgPorta05}"`);
        const finalImg = final.replace('src="final"', `src="${bs64FinalImg}"`);

        let combinedHTML;

        if (mvpproposal.projectModelFirst === '' && mvpproposal.projectModelSecond === '') {
            console.log('Nenhum campo preenchido');
        
        } else if (mvpproposal.projectModelFirst === '' && mvpproposal.projectModelSecond !== '') {
            combinedHTML = coverWithImages + companyWithImage + porta01 + porta02 + porta03 + porta04 + porta05 + details02WithLogo + details03WithLogo + details04WithLogo + finalImg;
            console.log('Project Model First vazio');
        
        } else if (mvpproposal.projectModelFirst !== '' && mvpproposal.projectModelSecond === '') {
            combinedHTML = coverWithImages + companyWithImage + porta01 + porta02 + porta03 + porta04 + porta05 + details01WithLogo + details03WithLogo + details04WithLogo + finalImg;
            console.log('Project Model Second vazio');
        
        } else if (mvpproposal.projectModelFirst !== '' && mvpproposal.projectModelSecond !== '') {
            combinedHTML = coverWithImages + companyWithImage + porta01 + porta02 + porta03 + porta04 + porta05 + details01WithLogo + details02WithLogo + details03WithLogo + details04WithLogo + finalImg;
            console.log('Todos preenchidos');
        
        } else {
            combinedHTML = null;  // Caso não se enquadre em nenhuma das condições
            console.log('Não definido corretamente');
        }
        
        // Agora você pode usar o `combinedHTML` com Puppeteer como quiser
        
        await page.setContent(combinedHTML);

        return new Promise((resolve, reject) => {
            page.pdf({ format: 'A4', printBackground: true, landscape: true }).then(buffer => {
                console.log('PDF generated successfully');
                resolve(buffer);
            }).catch(err => {
                console.error('Error generating PDF:', err);
                reject(new Error('Error generating PDF'));
            });
        });
      

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Error generating PDF');
    }
}

module.exports = {
    generatePDF
};
