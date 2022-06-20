const path = require('path');
const multer = require('multer');
const { redirect } = require('express/lib/response');
const exceltoJson = require('convert-excel-to-json');
const RawData = require('../models/RawData');
const ProcessedData = require('../models/ProcessedData');
const { mutipleMongooseToObject, mongooseToObject } = require('../convert');
const excelStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, `src/public`);
    },
    filename: (req, file, callback) => {
        //     let match = ['excel','spreadsheetml'];
        //     if(match.indexOf(file.mimetype)===-1)
        //     {const err = `The file is invalid !`;
        //     return callback(err,null);
        // }
        let filename = `Data-${Date.now()}${file.originalname}`;
        callback(null, filename);
    },
});
let message;
class MainController {
    async index(req, res) {
        const mess = message;
        message = '';
        let rawData = await RawData.find({});
        rawData = rawData.map((i) => {
            const newi = {
                name: i.name,
                id: i._id,
                record: i.record,
            };
            return newi;
        });
        res.render('home', { message: mess, data: rawData });
    }
    async uploadData(req, res) {
        let uploadFile = multer({ storage: excelStorage }).single('uploadfile');
        uploadFile(req, res, (error) => {
            if (error) return res.send(`Error when trying to upload: ${error}`);
            const result = exceltoJson({
                sourceFile: req.file.path,
            });
            const newData = new RawData();
            newData.data = result.data;
            newData.name = req.body.dataname;
            newData.record = result.data.length;
            newData.save();
            message = 'Import data successfully !';
            res.redirect('/');
        });
    }
    async preprocess(req, res) {
        let existData = await ProcessedData.findOne({ dataID: req.params.id });
        if (existData) {
            existData = mongooseToObject(existData);
            res.render('process-data', { data: existData });
        } else {
            const rawData = await RawData.findById(req.params.id);
            const data = rawData.data;
            const returnData = {};
            returnData.dataID = rawData._id;
            returnData.name = rawData.name;
            returnData.record = data.length;
            let minYear = data[0].A;
            let maxYear = data[0].A;
            let minMile = data[0].B;
            let maxMile = data[0].B;
            let minPrice = data[0].E;
            let maxPrice = data[0].E;
            data.forEach((i) => {
                if (i.A < minYear) minYear = i.A;
                if (i.A > maxYear) maxYear = i.A;
                if (i.B < minMile) minMile = i.B;
                if (i.B > maxMile) maxMile = i.B;
                if (i.E < minPrice) minPrice = i.E;
                if (i.E > maxPrice) maxPrice = i.E;
            });
            const yearSpace = Math.round((maxYear - minYear) / 5);
            const mileSpace = Math.round((maxMile - minMile) / 5);
            const priceSpace = Math.round((maxPrice - minPrice) / 5);
            returnData.year = [0, 0, 0, 0, 0, 0];
            returnData.mile = [0, 0, 0, 0, 0, 0];
            returnData.price = [0, 0, 0, 0, 0, 0];
            returnData.year[1] = `${minYear}-${minYear + yearSpace}`;
            returnData.year[2] = `${minYear + yearSpace + 1}-${
                minYear + yearSpace * 2
            }`;
            returnData.year[3] = `${minYear + yearSpace * 2 + 1}-${
                minYear + yearSpace * 3
            }`;
            returnData.year[4] = `${minYear + yearSpace * 3 + 1}-${
                minYear + yearSpace * 4
            }`;
            returnData.year[5] = `${minYear + yearSpace * 4 + 1}-${maxYear}`;
            returnData.mile[1] = `${minMile}-${minMile + mileSpace}`;
            returnData.mile[2] = `${minMile + mileSpace + 1}-${
                minMile + mileSpace * 2
            }`;
            returnData.mile[3] = `${minMile + mileSpace * 2 + 1}-${
                minMile + mileSpace * 3
            }`;
            returnData.mile[4] = `${minMile + mileSpace * 3 + 1}-${
                minMile + mileSpace * 4
            }`;
            returnData.mile[5] = `${minMile + mileSpace * 4 + 1}-${maxMile}`;
            returnData.price[1] = `${minPrice}-${minPrice + priceSpace}`;
            returnData.price[2] = `${minPrice + priceSpace + 1}-${
                minPrice + priceSpace * 2
            }`;
            returnData.price[3] = `${minPrice + priceSpace * 2 + 1}-${
                minPrice + priceSpace * 3
            }`;
            returnData.price[4] = `${minPrice + priceSpace * 3 + 1}-${
                minPrice + priceSpace * 4
            }`;
            returnData.price[5] = `${
                minPrice + priceSpace * 4 + 1
            }-${maxPrice}`;
            data.map((i) => {
                for (let x = 5; x > 0; x--) {
                    const min = parseInt(returnData.year[x].split('-')[0]);
                    if (i.A >= min) i.A = returnData.year[x];
                    else continue;
                }
                i.B =
                    returnData.mile[
                        Math.floor((i.B - minMile) / mileSpace) + 1
                    ];
                i.E =
                    returnData.price[
                        Math.floor((i.E - minPrice) / priceSpace) + 1
                    ];
                return i;
            });
            returnData.minYear = minYear;
            returnData.maxYear = maxYear;
            returnData.minMile = minMile;
            returnData.maxMile = maxMile;
            returnData.minPrice = minPrice;
            returnData.maxPrice = maxPrice;
            returnData.data = data;
            returnData.A = returnData.year;
            returnData.A.splice(0, 1);
            returnData.B = returnData.mile;
            returnData.B.splice(0, 1);
            returnData.C = [];
            returnData.D = [];
            returnData.data.forEach((i) => {
                if (!returnData.C.includes(i.C)) returnData.C.push(i.C);
                if (!returnData.D.includes(i.D)) returnData.D.push(i.D);
            });
            returnData.E = returnData.price;
            returnData.E.splice(0, 1);
            const processData = new ProcessedData(returnData);
            processData.save();
            res.render('process-data', { data: returnData });
        }
    }
    async buildDT(req, res) {
        const processData = await ProcessedData.findOne({
            dataID: req.params.id,
        });
        const trainData = processData.data.slice(
            0,
            Math.floor(processData.record * (req.params.p / 100)),
        );
        // res.json(processData);
        const T = [...trainData];
        const classtify = {
            node: [],
            oneClass: undefined,
        };
        //tạo node root
        const root = {
            nodeNum: 0,
            level: 0,
            element: [...Array(T.length).keys()],
            lastAtt: [],
            nextAtt: undefined
        };
        classtify.node[0] = root;
        // res.json(T);
        function DT(inode) {
            if(classtify.node[inode].element.length==0) return;
            if(classtify.node[inode].element.length==1) {classtify.node[inode].finalClass = T[classtify.node[inode].element[0]].E;
            return;}
            const A = classtify.node[inode].element.map((i) => T[i]);
            const x = allof(A);
            if (x[0]) {
                //node = 0 tức là node root
                if (inode === 0) oneClass = x[1];
                else classtify.node[inode].finalClass = x[1];
                return;
            }
            //trường hợp cây phân nhánh tới tầng thứ 3 thì dựa vào số lớp chiếm đa số để phân lớp
            //giảm overfiting
            else if (classtify.node[inode].level === 3) {
                classtify.node[inode].finalClass = mostClass(A);
                return;
            } else {
                //tiến hành phân nhánh theo thuộc tính được chọn
                const nextAtt = chooseAttribute(classtify.node[inode].lastAtt,A);
                classtify.node[inode].nextAtt = nextAtt;
                if(!nextAtt) return;
                const X = [...processData[nextAtt]];
                classtify.node[inode].attValue = X;
                classtify.node[inode].toNode = [];
                for(let t = 0;t<X.length;t++){
                    const num = classtify.node.length;
                    const newNode = {};
                    newNode.nodeNum = num;
                    newNode.level = classtify.node[inode].level+1;
                    newNode.lastAtt = nextAtt;
                    newNode.finalClass = undefined;
                    newNode.nextAtt = undefined;
                    newNode.element = [];
                    newNode.parentNode = inode;
                    newNode.chooseAtt = X[t];
                    //X[t] là giá trị thuộc tính để phân nhánh
                    A.forEach((item,id)=>{
                        if(item[nextAtt]===X[t]) newNode.element.push(classtify.node[inode].element[id]);
                    })
                    if(newNode.element.length==0) {
                        classtify.node[inode].toNode.push(null); continue;}
                    classtify.node.push(newNode);
                    classtify.node[inode].toNode.push(num);
                    DT(num);
                }
            }
        }
        DT(0);
        // DT(1);
        
        // res.json(classtify)
        function allof(a) {
            let result = [true, a[0].E];
            for (let i = 1; i < a.length; i++) {
                if (a[i].E != result[1]) {
                    result[1] = null;
                    return [false, null];
                }
                return result;
            }
        }
        function mostClass(a) {
            let price = [...processData.E];
            let count = [0, 0, 0, 0, 0, 0];
            for (let i = 0; i < a.length; i++) {
                count[price.indexOf(a[i].E)]++;
            }
            const max = Math.max(...count);
            return price[count.indexOf(max)];
        }
        // hàm xác định thuộc tinh để phân nhánh dựa trên infomation gain
        function chooseAttribute(lastAtt, A) {
            const Att = ['A', 'B', 'C', 'D'];
            // lastAtt.forEach((i) => {
            //     Att.splice(Att.indexOf(i), 1);
            // });
            const Etropy = [];
            Att.forEach((i)=>{
                const numA = []
                const numB = [];
                processData[i].forEach((k,index)=>{
                    // k = giá trị trong một thuộc tính
                    // i = thuộc tính
                    // j = một bản ghi
                    let num = [];
                    //sau vòng lặp này, có mảng numA là số bản ghi có thuộc tính = k
                    A.forEach(j=>{
                        if(j[i]==k)
                            if(!numA[index]) numA[index] = 1
                            else numA[index]++;
                        if(!num[processData.E.indexOf(j.E)]&& num[processData.E.indexOf(j.E)]!==0) num[processData.E.indexOf(j.E)] =0
                        else
                        num[processData.E.indexOf(j.E)]++;
                    });
                    // console.log(numA,num);
                    //tính Entropy tại k
                    let E = 0;
                    num.forEach(t=>{
                        E -= (t/numA[index])*Math.log2(t/numA[index]);
                    })
                    numB[index] = E;
                });
                let curE = 0;
                numA.forEach((x,id)=>{
                    curE+=x*numB[id];
                })
                Etropy.push(curE);
            });
            const min = Math.min(...Etropy);
            return Att[Etropy.indexOf(min)];
        }
        let testData = processData.data.splice(T.length,processData.data.length-1);
        //tiến hành test độ hiệu quả của cây quyết định
        testData = testData.map(i=>{
            let leafNode = false;
            let node = 0;
            while(!leafNode){
                if(classtify.node[node].finalClass){
                    leafNode = true;
                    i.guestClass = classtify.node[node].finalClass;
                }
                else if(classtify.node[node].attValue)
                {
                    node = classtify.node[node].toNode[classtify.node[node].attValue.indexOf(i[classtify.node[node].nextAtt])];
                    if(!node)
                    {
                        leafNode = true;
                        i.guestClass = '';
                    }
                }
                else{
                    leafNode = true;
                    i.guestClass = '';
                }
            }
            return i;
        })
        let correct = 0;
        testData.forEach(i=>{
            if(i.E === i.guestClass) correct++;
        });
        res.json({'Correct record': correct,
        'Test record': testData.length,
    'Accuracy': `${correct*100/testData.length}%`});
    }
}

module.exports = new MainController();
