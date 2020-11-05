require('dotenv').config()
const axios = require('axios')
const cheerio = require('cheerio')
const fs = require('fs')
const nodemailer = require('nodemailer')
const express = require('express')
const app = express()

const getNews = url => axios.get(url).then(res => res.data)

const sendMail = arr => {
    const user = process.env.EMAIL_BOT
    const pass = process.env.PASS_BOT
    const sender = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth:{ user , pass }
    })

    sender.sendMail({
        from: user,
        to: process.env.TO_EMAIL,
        subject: 'SAI - NEWS',
        text: arr
    }).then(info => console.log("sucesso ao enviar as novidades")
    ).catch(err => console.log("Erro no envio do email"))
    
}


const infoHandler = async () => {
    const content = await getNews("https://www.ufsm.br/orgaos-de-apoio/sai/busca/?q=&sites%5B%5D=402&tags=&orderby=date&order=DESC&perpage=50&area=&tipo_edital=&licitacao_edital=&concurso_edital_mod=&concurso_edital_cat=&outro_edital=")
    const $ = cheerio.load(content)
    let arr = []
    let newsI = 0
    let auxArr = []

    const oldNews = fs.readFileSync('lastNew.txt','utf8' ,(err,data) => data)
    

    //Pesquisar o indice da noticia que ja foi salva
    $(".col-lg-10.info-busca-lista").each((i, elem) => {
        let lastNews = ($(elem).text()).trim()
        lastNews = lastNews.split('\n')[0].trim()
        
        if (lastNews.includes(oldNews)) newsI = i
        
    })

    //Salva a noticia mais nova em um array auxiliar
    //Pega as noticias novas
    $(".col-lg-10.info-busca-lista").each((i, elem) => {
        let lastNews = ($(elem).text()).trim()
        lastNews = lastNews.split('\n')[0].trim()
        if (i == 0) auxArr.push(lastNews)
        if (i < newsI) arr.push(lastNews)
        
    })

    if (arr != "")  sendMail(arr.join('\n\n'))
    
    

    fs.writeFile('lastNew.txt', auxArr, err => {
        if (err) return console.log(err)
        console.log('Last new > lastNew.txt')
    })

}

app.get('/checkNews', (req, res) => {
    res.send('Bot started')
    infoHandler()
})

app.listen(process.env.PORT || 3000)