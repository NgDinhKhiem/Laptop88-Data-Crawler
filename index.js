const c = require("centra");
const fs = require("fs");
var json2xls = require('json2xls');
const {
    JSDOM
} = require('jsdom');
const {
    get
} = require("http");
const tabletojson = require('tabletojson').Tabletojson;
const {
    window
} = new JSDOM();

const start = window.performance.now();

let arr = [];
const url = "https://laptop88.vn/laptop-moi.html?page=";
const urn = "https://laptop88.vn";

async function getList(page) {
    const rawData = await c(url + page).send();
    const data = await rawData.text();
    let begin = data.search('<!----filter category--->');
    let end = data.search('<!---san pham--->')
    let cutData = data.substring(begin, end);
    const u = '<div class="product-item">';
    const a = '<div class="tooltip-content-group">';
    var count = 0;
    console.log(' ')
    while (cutData.search(u) != -1) {
        let st = cutData.search(u);
        let ed = cutData.search(a);
        let shortenData = cutData.substring(st, ed + a.length);
        cutData = cutData.substring(ed + a.length, cutData.length);
        if (shortenData.length > 300) {

            process.stdout.moveCursor(0, -1);
            process.stdout.clearLine(1);
            console.log(++count);
            await extractData(shortenData)
        }
    }

}

async function extractData(rawData) {
    fs.writeFileSync('test.html', rawData);
    //extractURI(rawData);
    var data = {
        "NAME": "",
        "CPU": "",
        "RAM": "",
        "DISK": "",
        "GPU": "",
        "SIZE": "",
        "BATTERY": "",
        "WEIGHT": "",
        "PRICE": ""
    }
    let extra = await getWandB(extractURI(rawData));
    try {
        let s1 = rawData.search('<!---<div class="icon_2022 price_shock"></div>--->');
        let s2 = rawData.substring(0, s1);
        let s3 = s2.search('alt=');
        let s4 = s2.substring(s3, s2.length);
        let s5 = s4.search('">');
        var name = s4.substring(5, s5);
        //name = name.replace('[Mới 100% Full Box] ',"");
        //name = name.replace('Mới 100% Full-box - ',"");
        let i1 = rawData.search('<table class="mce-item-table">');
        const c2 = '</table>';
        let i2 = rawData.search(c2);
        let htmlTable = rawData.substring(i1, i2 + c2.length);
        let jsonTable = tabletojson.convert(htmlTable)[0];
        data.NAME = name;
        data.CPU = jsonTable[0]['1'];
        data.RAM = jsonTable[1]['1'];
        data.DISK = jsonTable[2]['1'];
        data.GPU = jsonTable[3]['1'];
        data.SIZE = jsonTable[4]['1'];
        data.BATTERY = extra[1];
        data.WEIGHT = extra[0];
        let ct1 = '<span class="item-price">';
        let it1 = rawData.search(ct1);
        let st1 = rawData.substring(it1 + ct1.length, rawData.length);
        let it2 = st1.search('</span>');
        let price = st1.substring(0, it2);
        data.PRICE = price;
        //console.log(data);
        arr.push(data);
    } catch (err) {
        console.log(err);
    }
}

async function run() {
    for (var i = 1; i <= 14; i++) {
        console.clear();
        console.log(i + '/14');
        await getList(i);
    }
    fs.writeFileSync('data.xlsx', json2xls(arr), 'binary')
    const end = window.performance.now();
    console.log((end - start) / 1000 + "ms");
}

console.log('STARTING')
run();

//getWandB('https://laptop88.vn/moi-100-full-box-laptop-asus-tuf-f15-2022-fa507rc-hn051w-amd-ryzen-7-6800h-rtx-3050-144hz.html');

function extractURI(html) {
    const st = '<a href';
    let cutData = html.substring(html.search(st) + st.length + 2, html.length);
    cutData = cutData.substring(0, cutData.search('>') - 1);
    return urn + cutData;
}

async function getWandB(uri) {
    const html = await c(uri).send();
    const rawData = await html.text();
    //fs.writeFileSync(`${counter++}.html`, rawData)
    let a = '<table style="height: 1316px;" width="524" data-tablestyle="MsoNormalTable" data-tablelook="0">';
    const b = '</table>';
    if (rawData.search(a) == '-1')
        a = '<span>Thông số kỹ thuật</span>'
        //return ['NA', 'NA']
    let cutData = rawData.substring(rawData.search(a), rawData.length);
    cutData = cutData.substring(0, cutData.search(b));
    cutData = cutData.toLocaleLowerCase();
    const tk = 'kg';
    var kg = 'NA';
    let i_kg = cutData.search(tk);
    if (i_kg != '-1') {
        let data_kg = cutData.substring(i_kg - 20, i_kg - 1);
        data_kg = data_kg.substring(data_kg.lastIndexOf('>') + 1, data_kg.length);
        kg = data_kg;
    }
    let pin = 'NA';
    let i_pin = cutData.search('wh');
    if (i_pin != '-1') {
        let data_pin = cutData.substring(i_pin - 10, i_pin);
        let lastClose = data_pin.lastIndexOf('>');
        data_pin = cutData.substring(i_pin - 8 + lastClose, i_pin + 50);
        data_pin = data_pin.substring(0, data_pin.search('<'));
        pin = data_pin;
    }
    //console.log(uri)

    return [kg, pin];
}
