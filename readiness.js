const axios = require('axios');
const elastic = require('./../config').elastic;
const ELASTIC_URL = elastic.URL;
const FILE_STORAGE_URL = require('./../config').FILE_STORAGE_URL;
const EMAIL_URL = require('./../config').EMAIL_URL;
const CONTACT_MANAGER_URL = require('./../config').EMAIL_URL;
axios.defaults.timeout = 10000;

const readinessCheck = async (req, res) => {
    const result = await checkMicroservicesLinks();
    if (result.Status === 'Green') {
        res.status(200).json(result);
    }
    else {
        res.status(500).json(result);
    }

}
const checkMicroservicesLinks = async () => {
    const result = {Status: 'Green', Services: []};
    const healthResponse = await Promise.all([
        checkElasticSearch(),
        checkMicroserviceHealth({
            host: process.env.FILE_STORAGE_API_SERVICE_HOST,
            port: process.env.FILE_STORAGE_API_SERVICE_PORT,
            link: FILE_STORAGE_URL,
            name: 'FileStorage'
        }),
        checkMicroserviceHealth({
            host: process.env.EMAIL_SERVICE_SERVICE_HOST,
            port: process.env.EMAIL_SERVICE_SERVICE_PORT,
            link: EMAIL_URL,
            name: 'EmailService'
        }),
        checkMicroserviceHealth({
            host: process.env.CONTACT_MANAGER_SERVICE_HOST,
            port: process.env.CONTACT_MANAGER_SERVICE_PORT,
            link: CONTACT_MANAGER_URL,
            name: 'ContactManager'
        })
    ]);
    for (let i = 0; i < healthResponse.length; i++) {
        if(healthResponse[i]) {
            const health = Object.values(healthResponse[i]);
            if (health[0].Status !== 'OK') {
                result.Status = 'Red'
            }
            result.Services.push(healthResponse[i])
        }
    }
    return result
}
const checkElasticSearch = async () => {
    const result = {ElasticSearch: {Status: 'Failed'}};
    try {
        if (process.env.ELASTICSEARCH_URL) {
            const response = await axios.get(ELASTIC_URL);
            if (response.data && !response.error) {
                result.ElasticSearch.Status = 'OK';
                return result;
            }
        }
        result.ElasticSearch.Message = 'Invalid config for Elastic Search host found';
        return result;
    }
    catch (error) {         
        result.ElasticSearch.Message = 'Unable to connect with Elastic Search';
        if(!error.response){
            return result;
        }
        else {
            if (error.response.data.Status){
                result.ElasticSearch.Message = 'There is an readiness issue in Elastic Search';
            }
            return result;
        }
    }
}
const checkMicroserviceHealth = async ({host, port, link, name}) => {
    const result = {};
    result[name] = {Status: 'Faild'};
    try {
        if (host && port) {
            const response = await axios.get(`${link}healthz/readiness`);
            if (response.data.Status === 'Green') {
                result[name].Status = 'OK'
                console.log(result)
                //return result;
            }
        }
        result[name].Message = `Invalid config for ${name} host found`;
        console.log(result)
        //return result;
    }
    catch (error) {
        result[name].Message = `Unable to connect with ${name} microservice`;
        if (!error.response) {
            //return result;
            console.log(result);
        }
        else {
            if (error.response.data.Status) {
                result[name].Message = `There is an readiness issue in ${name} microservice`;
            }
            //return result;
            console.log(result);
        }
    }
}
/*const checkFileStorageAPI = async () => {
    const result = {FileStorage: {Status: 'Failed'}};
    try {
        if (process.env.FILE_STORAGE_API_SERVICE_HOST && process.env.FILE_STORAGE_API_SERVICE_PORT) {
            const response = await axios.get(`${FILE_STORAGE_URL}healthz/readiness`);
            if(response.data.Status === 'Green') {
                result.FileStorage.Status = `OK`;
                return result;
            }
            result.FileStorage.Status = 'Invalid config for File Storage API host found'
            return result;
        }
    }
    catch (error) {
        result.FileStorage.Message = 'Unable to connect with File Storage API';
        if(!error.response){
            return result;
        }
        else {
            if (error.response.data.Status){
                result.FileStorage.Message = 'There is an readiness issue in File Storage API';
            }
            return result;
        }
    }
}
const checkEmailService = async () => {
    const result = {EmailService: {Status: 'Failed'}};
    try {
        if (process.env.EMAIL_SERVICE_SERVICE_HOST && process.env.EMAIL_SERVICE_SERVICE_PORT) {
            const response = await axios.get(`${EMAIL_URL}healthz/readiness`);
            if(response.data.Status === 'Green') {
                result.EmailService.Status = `OK`;
                return result;
            }
            result.EmailService.Status = 'Invalid config for Email Service API host found'
            return result;
        }
    }
    catch (error) {
        result.EmailService.Message = 'Unable to connect with Email Service API';
        if(!error.response){
            return result;
        }
        else {
            if (error.response.data.Status){
                result.EmailService.Message = 'There is an readiness issue in Email Service API';
            }
            return result;
        }
    }
}
const checkContactManager = async () => {
    const result = {ContactManager: {Status: 'Failed'}};
    try {
        if (process.env.CONTACT_MANAGER_SERVICE_HOST && process.env.CONTACT_MANAGER_SERVICE_PORT) {
            const response = await axios.get(`${microservicesLinks.ContactManager}healthz/readiness`);
            if (response.data.Status === 'Green') {
                result.ContactManager.Status = 'OK';
                return result;
            }
        }
        result.ContactManager.Message = 'Invalid config for Contact Manager host found';
        return result;
    }
    catch (error) {
        result.ContactManager.Message = 'Unable to connect with Contact Manager';
        if(!error.response){
            return result;
        }
        else {
            if (error.response.data.Status){
                result.ContactManager.Message = 'There is an readiness issue in Contact Manager microservice';
            }
            return result;
        }
    }
}*/

module.exports = {
    readinessCheck
}
