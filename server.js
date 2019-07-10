if(process.env.NODE_ENV==='local'){
    require('dotenv').config();
}    
const bearerToken = require('express-bearer-token');
const app = require('express')();
const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { server } = require('./config');
const schema = require('./schema');
const auth = require('./lib/auth');
const { formatErr } = require('./utils');
const { readinessCheck } = require('./lib/readiness');

app.use(cors());

app.get('/healthz/liveness', (req, res) => {
    res.status(200).json({"Status": "Running"});
});

app.get('/healthz/readiness', function(req, res){
    readinessCheck(req, res);
});

app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
}));


app.use(bearerToken());

const buildOptions = async (req, res) => {
    const user = req.token ? auth.getUserFromToken(req.token) : null;
    return {
        context: {user},
        formatError: formatErr,
        schema
    }
}

app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions));

app.listen(server.port, () => {
    console.log('info', `Running a GraphQL API server at ${server.host}:${server.port}/graphql`);
});
