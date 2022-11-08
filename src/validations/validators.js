const checkBlankValues = (val) => {
    if (typeof val === undefined || typeof val === null) return false
    if (typeof val === "string" && val.trim().length === 0) return false
    if (typeof val === "number" && val.trim().val === 0) return false
    else return true
}

const isValidName = function (val) {
    let validName = /^[a-zA-Z0-9_ ]*$/
    return validName.test(val)
};
const stringValidation = function (val) {
    let string = /^[a-zA-Z_ ]*$/
    return string.test(val)
};
const isValidprice = function (val) {
    let money = /^\d{0,8}[.]?\d{1,4}$/
    return money.test(val)
};

const decimalNoValidator = function(val){
    let validatorregx = /^[1-9][\.\d]*(,\d+)?$/;
    return validatorregx.test(val)
}
const isValidInstallment = function (val) {
   let validInst = /^[0-9]+$/
    return validInst.test(val);
};

const isValidSort = function (val) {
    let isValidSort = /^[1,-1]+$/
     return isValidSort.test(val);
 };

const isValidPhone = function (val) {
    if(val = /^[6-9]\d{9}$/) return true;
    else return false;
};

const isValidEmail = function (val) {
    if(val = /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/) return true;
    else return false;
};

const isValidPassword = function (val) {
    if(val =
        /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,15}$/) return true;
        else return false
};


const isvalidPincode = function (val) {
    if (val = /^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/) return true;
    else return false;
};

const bodyValidation = function(val){
    if(Object.keys(val).length !== 0) return true
    else return false

}

const validNos = function(val){
    let no = /^(\d*\.)?\d+$/
    return no.test(val)
}

const empty = function(val){
    if(val == '') return false
    else return true

}

module.exports = { checkBlankValues, isValidName,stringValidation, isValidprice,decimalNoValidator, isValidInstallment, isValidPhone, isValidEmail, isValidPassword, isvalidPincode, bodyValidation,validNos,isValidSort, empty }